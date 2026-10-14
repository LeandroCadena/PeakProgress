import { getDatabase } from "./database";
import { saveLocalRoutine } from "./repositories/routineRepository";

import type { RoutineEditorSnapshot } from "../store/routineEditorStore";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`[Sync Test] ${message}`);
    }
}

export async function testSyncQueueAtomicity(): Promise<void> {
    const db = await getDatabase();

    const userId = "__sync_test_user__";
    const routineId = "__sync_test_routine__";
    const operationId = "__sync_test_operation__";

    const originalSnapshot: RoutineEditorSnapshot = {
        routineId,
        name: "Original Routine",
        exercises: [],
        setsByExerciseId: {},
    };

    try {
        // Limpiar exclusivamente los registros de prueba
        // para que el test pueda ejecutarse varias veces.
        await db.withExclusiveTransactionAsync(async (tx) => {
            await tx.runAsync(
                `DELETE FROM sync_operations
                 WHERE id = ? AND user_id = ?`,
                [operationId, userId]
            );

            await tx.runAsync(
                `DELETE FROM local_routines
                 WHERE id = ? AND user_id = ?`,
                [routineId, userId]
            );
        });

        // PRUEBA 1: guardar rutina y operación pendiente.
        await saveLocalRoutine({
            userId,
            snapshot: originalSnapshot,
            syncOperationId: operationId,
        });

        const savedRoutine = await db.getFirstAsync<{
            name: string;
        }>(
            `SELECT name
             FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        const savedOperation = await db.getFirstAsync<{
            id: string;
            status: string;
        }>(
            `SELECT id, status
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(savedRoutine?.name === "Original Routine", "Routine was not saved.");

        assert(savedOperation?.status === "pending", "Pending operation was not created.");

        console.log("[Sync Test] Atomic save PASSED");

        // PRUEBA 2: provocar un fallo en la cola.
        // Reutilizar el mismo operationId viola la
        // PRIMARY KEY de sync_operations.
        let failedAsExpected = false;

        try {
            await saveLocalRoutine({
                userId,
                snapshot: {
                    ...originalSnapshot,
                    name: "This Change Must Roll Back",
                },
                syncOperationId: operationId,
            });
        } catch {
            failedAsExpected = true;
        }

        assert(failedAsExpected, "Duplicate operation ID did not cause a failure.");

        // Verificar que la modificación de la rutina
        // fue revertida.
        const routineAfterFailure = await db.getFirstAsync<{
            name: string;
        }>(
            `SELECT name
             FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        assert(routineAfterFailure?.name === "Original Routine", "Transaction rollback failed.");

        console.log("[Sync Test] Transaction rollback PASSED");

        // PRUEBA 3: comprobar que no se duplicó la cola.
        const operationCount = await db.getFirstAsync<{
            total: number;
        }>(
            `SELECT COUNT(*) AS total
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(operationCount?.total === 1, "Unexpected number of sync operations.");

        console.log("[Sync Test] Queue integrity PASSED");
    } finally {
        // La limpieza se ejecuta incluso si falla un assert.
        await db.withExclusiveTransactionAsync(async (tx) => {
            await tx.runAsync(
                `DELETE FROM sync_operations
                 WHERE id = ? AND user_id = ?`,
                [operationId, userId]
            );

            await tx.runAsync(
                `DELETE FROM local_routines
                 WHERE id = ? AND user_id = ?`,
                [routineId, userId]
            );
        });
    }
}
