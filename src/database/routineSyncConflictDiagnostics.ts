import { getDatabase } from "./database";
import { saveLocalRoutine } from "./repositories/routineRepository";
import { getRoutineSyncConflicts } from "./repositories/routineSyncConflictRepository";
import {
    claimPendingSyncOperation,
    markSyncOperationConflict,
} from "./repositories/syncQueueRepository";

export async function runRoutineSyncConflictDiagnostics(): Promise<void> {
    const db = await getDatabase();

    const userId = "diagnostic-conflict-reader-user";
    const otherUserId = "diagnostic-conflict-reader-other-user";
    const routineId = "diagnostic-conflict-reader-routine";
    const operationId = "diagnostic-conflict-reader-operation";
    const leaseToken = "diagnostic-conflict-reader-lease";

    const localSnapshot = {
        routineId,
        name: "Local routine",
        exercises: [],
        setsByExerciseId: {},
    };

    const remoteSnapshot = {
        ...localSnapshot,
        name: "Remote routine",
    };

    try {
        // Limpiar únicamente los registros de esta prueba.
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        await saveLocalRoutine({
            userId,
            snapshot: localSnapshot,
            syncOperationId: operationId,
        });

        const claimed = await claimPendingSyncOperation(userId, operationId, leaseToken);

        if (!claimed) {
            throw new Error("Could not claim test operation.");
        }

        const registered = await markSyncOperationConflict({
            userId,
            operationId,
            leaseToken,
            remoteVersion: 3,
            remoteSnapshot,
        });

        if (!registered) {
            throw new Error("Could not register test conflict.");
        }

        // El usuario propietario debe poder consultar el conflicto.
        const ownConflicts = await getRoutineSyncConflicts(userId);

        const conflict = ownConflicts.find((item) => item.operationId === operationId);

        if (!conflict) {
            throw new Error("Stored conflict was not returned.");
        }

        if (
            conflict.routineId !== routineId ||
            conflict.operationType !== "upsert" ||
            conflict.remoteVersion !== 3 ||
            conflict.localSnapshot?.name !== "Local routine" ||
            conflict.remoteSnapshot?.name !== "Remote routine"
        ) {
            throw new Error("Stored conflict data does not match.");
        }

        // Otro usuario no debe poder consultar el conflicto.
        const otherUserConflicts = await getRoutineSyncConflicts(otherUserId);

        if (otherUserConflicts.some((item) => item.operationId === operationId)) {
            throw new Error("Conflict was exposed to another user.");
        }

        // Leer el conflicto no debe modificar la operación.
        const operation = await db.getFirstAsync<{
            status: string;
            lease_token: string | null;
        }>(
            `SELECT status, lease_token
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        if (operation?.status !== "conflict" || operation.lease_token !== null) {
            throw new Error("Reading conflicts unexpectedly changed the queue.");
        }

        console.log("[SQLite] Routine conflict reading diagnostics passed.");
    } finally {
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );
    }
}
