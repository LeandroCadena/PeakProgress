import type { RoutineEditorSnapshot } from "../../store/routineEditorStore";
import { getDatabase } from "../database";

export type RoutineSyncConflict = {
    operationId: string;
    routineId: string;
    operationType: "upsert" | "delete";
    remoteVersion: number;
    localSnapshot: RoutineEditorSnapshot | null;
    remoteSnapshot: RoutineEditorSnapshot | null;
    createdAt: string;
};

type ConflictRow = {
    operation_id: string;
    routine_id: string;
    operation_type: "upsert" | "delete";
    local_payload: string;
    remote_version: number;
    remote_snapshot: string | null;
    created_at: string;
};

function isRoutineEditorSnapshot(value: unknown): value is RoutineEditorSnapshot {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.routineId === "string" &&
        typeof candidate.name === "string" &&
        Array.isArray(candidate.exercises) &&
        typeof candidate.setsByExerciseId === "object" &&
        candidate.setsByExerciseId !== null &&
        !Array.isArray(candidate.setsByExerciseId)
    );
}

function parseSnapshot(serialized: string | null, routineId: string): RoutineEditorSnapshot | null {
    if (serialized === null) {
        return null;
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(serialized);
    } catch {
        throw new Error("Invalid stored routine snapshot JSON.");
    }

    if (!isRoutineEditorSnapshot(parsed) || parsed.routineId !== routineId) {
        throw new Error("Invalid stored routine snapshot.");
    }

    return parsed;
}

export async function getRoutineSyncConflicts(userId: string): Promise<RoutineSyncConflict[]> {
    if (!userId.trim()) {
        throw new Error("A user ID is required.");
    }

    const db = await getDatabase();

    const rows = await db.getAllAsync<ConflictRow>(
        `SELECT
            conflict.operation_id,
            conflict.routine_id,
            operation.operation_type,
            operation.payload AS local_payload,
            conflict.remote_version,
            conflict.remote_snapshot,
            conflict.created_at
         FROM routine_sync_conflicts AS conflict
         INNER JOIN sync_operations AS operation
             ON operation.id = conflict.operation_id
            AND operation.user_id = conflict.user_id
            AND operation.entity_type = 'routine'
            AND operation.entity_id = conflict.routine_id
         WHERE conflict.user_id = ?
           AND operation.status = 'conflict'
         ORDER BY conflict.created_at DESC,
                  conflict.operation_id DESC`,
        [userId]
    );

    return rows.map((row) => ({
        operationId: row.operation_id,
        routineId: row.routine_id,
        operationType: row.operation_type,
        remoteVersion: row.remote_version,
        localSnapshot:
            row.operation_type === "upsert"
                ? parseSnapshot(row.local_payload, row.routine_id)
                : null,
        remoteSnapshot: parseSnapshot(row.remote_snapshot, row.routine_id),
        createdAt: row.created_at,
    }));
}
