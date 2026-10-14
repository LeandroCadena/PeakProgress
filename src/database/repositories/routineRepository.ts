import type { RoutineEditorSnapshot } from "../../store/routineEditorStore";
import { getDatabase } from "../database";

import { enqueueSyncOperation, replacePendingRoutineUpsert } from "./syncQueueRepository";

export type SaveLocalRoutineParams = {
    userId: string;
    snapshot: RoutineEditorSnapshot;
    syncOperationId?: string;
    createdLocally?: boolean;
};

export async function saveLocalRoutine({
    userId,
    snapshot,
    syncOperationId,
    createdLocally = false,
}: SaveLocalRoutineParams): Promise<void> {
    if (!userId.trim()) {
        throw new Error("A user ID is required to save a local routine.");
    }

    if (!snapshot.routineId.trim()) {
        throw new Error("A routine ID is required.");
    }

    if (syncOperationId !== undefined && !syncOperationId.trim()) {
        throw new Error("Sync operation ID cannot be empty.");
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.withExclusiveTransactionAsync(async (tx) => {
        let consolidatedPendingOperation = false;

        const existingRoutine = await tx.getFirstAsync<{
            user_id: string;
            remote_state: string;
            remote_version: number | null;
            sync_status: string;
            deleted_at: string | null;
        }>(
            `SELECT
        user_id,
        remote_state,
        remote_version,
        sync_status,
        deleted_at
     FROM local_routines
     WHERE id = ?`,
            [snapshot.routineId]
        );

        if (existingRoutine && existingRoutine.user_id !== userId) {
            throw new Error("This routine belongs to another local user.");
        }

        if (existingRoutine?.deleted_at !== null && existingRoutine?.deleted_at !== undefined) {
            throw new Error("Cannot save a deleted routine.");
        }

        if (syncOperationId && existingRoutine?.sync_status === "conflict") {
            throw new Error("Cannot save a routine with an unresolved synchronization conflict.");
        }

        if (createdLocally && existingRoutine) {
            throw new Error("Cannot mark an existing routine as newly created.");
        }

        if (createdLocally && !syncOperationId) {
            throw new Error("A locally created routine requires a sync operation.");
        }

        if (syncOperationId && existingRoutine) {
            const operations = await tx.getAllAsync<{
                id: string;
                operation_type: string;
                status: string;
                attempts: number;
            }>(
                `SELECT id, operation_type, status, attempts
         FROM sync_operations
         WHERE user_id = ?
           AND entity_type = 'routine'
           AND entity_id = ?`,
                [userId, snapshot.routineId]
            );

            if (operations.length === 0 && existingRoutine.sync_status !== "synced") {
                throw new Error(
                    "Routine synchronization state is inconsistent: no queued operation was found."
                );
            }

            if (operations.length > 0) {
                const canConsolidate =
                    operations.length === 1 &&
                    operations[0].operation_type === "upsert" &&
                    operations[0].status === "pending" &&
                    operations[0].attempts === 0;

                if (!canConsolidate) {
                    throw new Error(
                        "This routine has a synchronization operation that cannot be consolidated."
                    );
                }

                consolidatedPendingOperation = await replacePendingRoutineUpsert(tx, {
                    userId,
                    routineId: snapshot.routineId,
                    snapshot,
                });

                if (!consolidatedPendingOperation) {
                    throw new Error("Could not consolidate the pending routine operation.");
                }
            }
        }

        const remoteState = createdLocally
            ? "never_synced"
            : (existingRoutine?.remote_state ?? "unknown");

        const syncStatus = syncOperationId ? "pending" : "synced";

        if (!syncOperationId && existingRoutine) {
            const pendingChanges = await tx.getFirstAsync<{
                sync_status: string;
            }>(
                `SELECT sync_status
                 FROM local_routines
                 WHERE id = ?
                   AND user_id = ?`,
                [snapshot.routineId, userId]
            );

            if (pendingChanges?.sync_status !== "synced") {
                throw new Error(
                    "Cannot overwrite a routine with pending or conflicting local changes."
                );
            }

            const queuedOperation = await tx.getFirstAsync<{ id: string }>(
                `SELECT id
                 FROM sync_operations
                 WHERE user_id = ?
                   AND entity_type = 'routine'
                   AND entity_id = ?
                 LIMIT 1`,
                [userId, snapshot.routineId]
            );

            if (queuedOperation) {
                throw new Error("Cannot overwrite a routine while sync operations exist.");
            }
        }

        await tx.runAsync(
            `INSERT INTO local_routines (
        id,
        user_id,
        name,
        created_at,
        updated_at,
        deleted_at,
        sync_status,
        remote_state
    )
    VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        updated_at = excluded.updated_at,
        deleted_at = NULL,
        sync_status = excluded.sync_status,
        remote_state = local_routines.remote_state
    WHERE local_routines.user_id = excluded.user_id`,
            [snapshot.routineId, userId, snapshot.name, now, now, syncStatus, remoteState]
        );

        // Reemplazamos los ejercicios y las series dentro
        // de la misma transacción.
        await tx.runAsync(
            `DELETE FROM local_routine_exercises
             WHERE routine_id = ?`,
            [snapshot.routineId]
        );

        for (const exercise of snapshot.exercises) {
            await tx.runAsync(
                `INSERT INTO local_routine_exercises (
                    id,
                    routine_id,
                    exercise_id,
                    position,
                    rest_seconds,
                    exercise_rest_seconds,
                    notes,
                    exercise_name,
                    exercise_image_url,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
                [
                    exercise.id,
                    snapshot.routineId,
                    exercise.exercise_id,
                    exercise.position,
                    exercise.rest_seconds,
                    exercise.exercise_rest_seconds,
                    exercise.exercise?.name ?? null,
                    exercise.exercise?.image_url ?? null,
                    now,
                    now,
                ]
            );

            const sets = snapshot.setsByExerciseId[exercise.id] ?? [];

            for (const set of sets) {
                await tx.runAsync(
                    `INSERT INTO local_routine_exercise_sets (
                        id,
                        routine_exercise_id,
                        reps,
                        weight,
                        is_pr,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        set.id,
                        exercise.id,
                        set.reps,
                        set.weight,
                        set.is_pr ? 1 : 0,
                        set.created_at,
                        now,
                    ]
                );
            }
        }

        let expectedVersion: number | null = null;

        if (syncOperationId) {
            const earlierOperation = await tx.getFirstAsync<{
                id: string;
            }>(
                `SELECT id
         FROM sync_operations
         WHERE user_id = ?
           AND entity_type = 'routine'
           AND entity_id = ?
         LIMIT 1`,
                [userId, snapshot.routineId]
            );

            if (!earlierOperation) {
                expectedVersion = existingRoutine?.remote_version ?? null;
            }
        }

        if (syncOperationId && !consolidatedPendingOperation) {
            await enqueueSyncOperation(tx, {
                id: syncOperationId,
                userId,
                entityType: "routine",
                entityId: snapshot.routineId,
                operationType: "upsert",
                payload: snapshot,
                expectedVersion,
            });
        }
    });
}

export async function hydrateLocalRoutine(params: {
    userId: string;
    snapshot: RoutineEditorSnapshot;
    remoteVersion: number;
}): Promise<boolean> {
    const { userId, snapshot, remoteVersion } = params;

    if (!userId.trim() || !snapshot.routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    if (!snapshot.name.trim()) {
        throw new Error("Routine name is required.");
    }

    if (!Number.isSafeInteger(remoteVersion) || remoteVersion < 0) {
        throw new Error("Invalid remote routine version.");
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    let hydrated = false;

    await db.withExclusiveTransactionAsync(async (tx) => {
        const existing = await tx.getFirstAsync<{
            user_id: string;
            sync_status: string;
            deleted_at: string | null;
        }>(
            `SELECT user_id, sync_status, deleted_at
             FROM local_routines
             WHERE id = ?`,
            [snapshot.routineId]
        );

        if (existing?.user_id && existing.user_id !== userId) {
            throw new Error("Routine belongs to another local user.");
        }

        // No sobrescribir rutinas eliminadas ni cambios locales.
        if (existing?.deleted_at != null || (existing && existing.sync_status !== "synced")) {
            return;
        }

        const queued = await tx.getFirstAsync<{ id: string }>(
            `SELECT id
             FROM sync_operations
             WHERE user_id = ?
               AND entity_type = 'routine'
               AND entity_id = ?
             LIMIT 1`,
            [userId, snapshot.routineId]
        );

        if (queued) {
            return;
        }

        await tx.runAsync(
            `INSERT INTO local_routines (
                id, user_id, name, created_at, updated_at,
                deleted_at, sync_status, remote_state, remote_version
            )
            VALUES (?, ?, ?, ?, ?, NULL, 'synced', 'exists', ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                updated_at = excluded.updated_at,
                sync_status = 'synced',
                remote_state = 'exists',
                remote_version = excluded.remote_version
            WHERE local_routines.user_id = excluded.user_id
              AND local_routines.deleted_at IS NULL
              AND local_routines.sync_status = 'synced'`,
            [snapshot.routineId, userId, snapshot.name, now, now, remoteVersion]
        );

        await tx.runAsync(
            `DELETE FROM local_routine_exercises
             WHERE routine_id = ?`,
            [snapshot.routineId]
        );

        for (const exercise of snapshot.exercises) {
            if (exercise.routine_id !== snapshot.routineId) {
                throw new Error("Exercise belongs to another routine.");
            }

            await tx.runAsync(
                `INSERT INTO local_routine_exercises (
                    id, routine_id, exercise_id, position,
                    rest_seconds, exercise_rest_seconds, notes,
                    exercise_name, exercise_image_url,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
                [
                    exercise.id,
                    snapshot.routineId,
                    exercise.exercise_id,
                    exercise.position,
                    exercise.rest_seconds ?? 90,
                    exercise.exercise_rest_seconds ?? 120,
                    exercise.exercise?.name ?? null,
                    exercise.exercise?.image_url ?? null,
                    now,
                    now,
                ]
            );

            for (const set of snapshot.setsByExerciseId[exercise.id] ?? []) {
                if (set.routine_exercise_id !== exercise.id) {
                    throw new Error("Set belongs to another exercise.");
                }

                await tx.runAsync(
                    `INSERT INTO local_routine_exercise_sets (
                        id, routine_exercise_id, reps, weight,
                        is_pr, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        set.id,
                        exercise.id,
                        set.reps,
                        set.weight,
                        set.is_pr ? 1 : 0,
                        set.created_at,
                        now,
                    ]
                );
            }
        }

        hydrated = true;
    });

    return hydrated;
}

type LocalRoutineRow = {
    id: string;
    user_id: string;
    name: string;
};

type LocalRoutineExerciseRow = {
    id: string;
    routine_id: string;
    exercise_id: string;
    position: number;
    rest_seconds: number;
    exercise_rest_seconds: number;
    exercise_name: string | null;
    exercise_image_url: string | null;
};

type LocalRoutineSetRow = {
    id: string;
    routine_exercise_id: string;
    reps: number;
    weight: number;
    is_pr: number;
    created_at: string;
};

export async function getLocalRoutine(params: {
    userId: string;
    routineId: string;
}): Promise<RoutineEditorSnapshot | null> {
    const { userId, routineId } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const db = await getDatabase();

    const routine = await db.getFirstAsync<LocalRoutineRow>(
        `SELECT id, user_id, name
         FROM local_routines
         WHERE id = ?
           AND user_id = ?
           AND deleted_at IS NULL`,
        [routineId, userId]
    );

    if (!routine) {
        return null;
    }

    const exerciseRows = await db.getAllAsync<LocalRoutineExerciseRow>(
        `SELECT
                id,
                routine_id,
                exercise_id,
                position,
                rest_seconds,
                exercise_rest_seconds,
                exercise_name,
                exercise_image_url
             FROM local_routine_exercises
             WHERE routine_id = ?
             ORDER BY position ASC, created_at ASC, id ASC`,
        [routine.id]
    );

    const exercises: RoutineEditorSnapshot["exercises"] = exerciseRows.map((row) => ({
        id: row.id,
        routine_id: row.routine_id,
        exercise_id: row.exercise_id,
        position: row.position,
        rest_seconds: row.rest_seconds,
        exercise_rest_seconds: row.exercise_rest_seconds,
        exercise: row.exercise_name
            ? {
                  name: row.exercise_name,
                  image_url: row.exercise_image_url,
              }
            : null,
    }));

    const setsByExerciseId: RoutineEditorSnapshot["setsByExerciseId"] = {};

    for (const exercise of exercises) {
        const setRows = await db.getAllAsync<LocalRoutineSetRow>(
            `SELECT
                id,
                routine_exercise_id,
                reps,
                weight,
                is_pr,
                created_at
             FROM local_routine_exercise_sets
             WHERE routine_exercise_id = ?
             ORDER BY created_at ASC, id ASC`,
            [exercise.id]
        );

        setsByExerciseId[exercise.id] = setRows.map((row) => ({
            id: row.id,
            routine_exercise_id: row.routine_exercise_id,
            reps: row.reps,
            weight: row.weight,
            is_pr: row.is_pr === 1,
            created_at: row.created_at,
        }));
    }

    return {
        routineId: routine.id,
        name: routine.name,
        exercises,
        setsByExerciseId,
    };
}

export type LocalRoutineSummary = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export async function getLocalRoutines(userId: string): Promise<LocalRoutineSummary[]> {
    if (!userId.trim()) {
        throw new Error("A user ID is required.");
    }

    const db = await getDatabase();

    return db.getAllAsync<LocalRoutineSummary>(
        `SELECT
            id,
            name,
            created_at,
            updated_at
         FROM local_routines
         WHERE user_id = ?
           AND deleted_at IS NULL
         ORDER BY created_at DESC, id DESC`,
        [userId]
    );
}

export async function deleteLocalRoutine(params: {
    userId: string;
    routineId: string;
    syncOperationId?: string;
}): Promise<boolean> {
    const { userId, routineId, syncOperationId } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    let wasDeleted = false;

    await db.withExclusiveTransactionAsync(async (tx) => {
        const metadata = await tx.getFirstAsync<{
            remote_version: number | null;
        }>(
            `SELECT remote_version
     FROM local_routines
     WHERE id = ?
       AND user_id = ?`,
            [routineId, userId]
        );

        if (!metadata) {
            throw new Error("Local routine not found.");
        }

        const earlierOperation = await tx.getFirstAsync<{
            id: string;
        }>(
            `SELECT id
     FROM sync_operations
     WHERE user_id = ?
       AND entity_type = 'routine'
       AND entity_id = ?
     LIMIT 1`,
            [userId, routineId]
        );

        const expectedVersion = earlierOperation ? null : metadata.remote_version;

        const result = await tx.runAsync(
            `UPDATE local_routines
             SET deleted_at = ?,
                updated_at = ?,
                sync_status = CASE
                    WHEN ? = 1 THEN 'pending'
                    ELSE sync_status
                END
             WHERE id = ?
               AND user_id = ?
               AND deleted_at IS NULL`,
            [now, now, syncOperationId ? 1 : 0, routineId, userId]
        );

        if (result.changes === 0) {
            return;
        }

        if (syncOperationId) {
            await enqueueSyncOperation(tx, {
                id: syncOperationId,
                userId,
                entityType: "routine",
                entityId: routineId,
                operationType: "delete",
                payload: {
                    routineId,
                    deletedAt: now,
                },
                expectedVersion,
            });
        }

        wasDeleted = true;
    });

    return wasDeleted;
}

export type LocalRoutineSyncStatus = "synced" | "pending" | "conflict";

export type LocalRoutineSyncMetadata = {
    routineId: string;
    remoteVersion: number | null;
    syncStatus: LocalRoutineSyncStatus;
    isDeleted: boolean;
};

type LocalRoutineSyncMetadataRow = {
    id: string;
    remote_version: number | null;
    sync_status: LocalRoutineSyncStatus;
    deleted_at: string | null;
};

export async function getLocalRoutineSyncMetadata(params: {
    userId: string;
    routineId: string;
}): Promise<LocalRoutineSyncMetadata | null> {
    const { userId, routineId } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const db = await getDatabase();

    const row = await db.getFirstAsync<LocalRoutineSyncMetadataRow>(
        `SELECT
                id,
                remote_version,
                sync_status,
                deleted_at
             FROM local_routines
             WHERE id = ?
               AND user_id = ?`,
        [routineId, userId]
    );

    if (!row) {
        return null;
    }

    return {
        routineId: row.id,
        remoteVersion: row.remote_version,
        syncStatus: row.sync_status,
        isDeleted: row.deleted_at !== null,
    };
}
