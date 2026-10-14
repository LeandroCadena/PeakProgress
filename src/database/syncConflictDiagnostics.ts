import { getDatabase } from "./database";
import {
    getLocalRoutine,
    getLocalRoutineSyncMetadata,
    saveLocalRoutine,
} from "./repositories/routineRepository";
import {
    claimPendingSyncOperation,
    getPendingSyncOperations,
    markSyncOperationConflict,
} from "./repositories/syncQueueRepository";

export async function runSyncConflictDiagnostics(): Promise<void> {
    const db = await getDatabase();

    const userId = "diagnostic-conflict-user";
    const routineId = "diagnostic-conflict-routine";
    const operationId = "diagnostic-conflict-operation";
    const validLease = "diagnostic-conflict-valid-lease";

    const snapshot = {
        routineId,
        name: "Original diagnostic routine",
        exercises: [],
        setsByExerciseId: {},
    };

    try {
        // Limpiar datos de ejecuciones anteriores.
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE user_id = ?`,
            [userId]
        );

        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        // Guardar rutina y operación pendiente.
        await saveLocalRoutine({
            userId,
            snapshot,
            syncOperationId: operationId,
        });

        // Reclamar la operación.
        const claimed = await claimPendingSyncOperation(userId, operationId, validLease);

        if (!claimed) {
            throw new Error("Could not claim diagnostic operation.");
        }

        // Un lease incorrecto no debe registrar el conflicto.
        const invalidResult = await markSyncOperationConflict({
            userId,
            operationId,
            leaseToken: "incorrect-lease",
            remoteVersion: 2,
            remoteSnapshot: snapshot,
        });

        if (invalidResult) {
            throw new Error("Conflict was registered with an invalid lease.");
        }

        const before = await db.getFirstAsync<{
            status: string;
            lease_token: string | null;
        }>(
            `SELECT status, lease_token
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        if (before?.status !== "processing" || before.lease_token !== validLease) {
            throw new Error("Invalid lease unexpectedly modified the operation.");
        }

        // Registrar el conflicto con el lease correcto.
        const registered = await markSyncOperationConflict({
            userId,
            operationId,
            leaseToken: validLease,
            remoteVersion: 2,
            remoteSnapshot: snapshot,
        });

        if (!registered) {
            throw new Error("Valid conflict was not registered.");
        }

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
            throw new Error("Operation did not enter conflict state correctly.");
        }

        const metadata = await getLocalRoutineSyncMetadata({
            userId,
            routineId,
        });

        if (metadata?.syncStatus !== "conflict") {
            throw new Error("Local routine was not marked as conflicting.");
        }

        const pendingOperations = await getPendingSyncOperations(userId);

        if (pendingOperations.some((item) => item.id === operationId)) {
            throw new Error("Conflicting operation appeared in pending queue.");
        }

        const storedRoutine = await getLocalRoutine({
            userId,
            routineId,
        });

        if (storedRoutine?.name !== snapshot.name) {
            throw new Error("Local routine content was unexpectedly modified.");
        }

        console.log("[SQLite] Sync conflict diagnostics passed.");
    } finally {
        // El diagnóstico no debe dejar datos de prueba.
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE user_id = ?`,
            [userId]
        );

        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );
    }
}
