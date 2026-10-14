import { getDatabase } from "./database";

import {
    claimPendingSyncOperation,
    completeSyncOperation,
    enqueueSyncOperation,
    markSyncOperationFailed,
    recoverInterruptedSyncOperations,
} from "./repositories/syncQueueRepository";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`[Sync Lease Test] ${message}`);
    }
}

export async function testSyncLeaseProtection(): Promise<void> {
    const db = await getDatabase();

    const userId = "__sync_lease_test_user__";
    const operationId = "__sync_lease_test_operation__";
    const routineId = "__sync_lease_test_routine__";

    const leaseA = "__sync_lease_A__";
    const leaseB = "__sync_lease_B__";

    try {
        // Eliminar únicamente datos de una ejecución anterior.
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        // Crear una operación pendiente.
        await db.withExclusiveTransactionAsync(async (tx) => {
            await enqueueSyncOperation(tx, {
                id: operationId,
                userId,
                entityType: "routine",
                entityId: routineId,
                operationType: "upsert",
                payload: {
                    routineId,
                    name: "Lease Test Routine",
                },
            });
        });

        // PRUEBA 1: el primer intento reclama la operación.
        const firstClaim = await claimPendingSyncOperation(userId, operationId, leaseA);

        assert(firstClaim, "First claim failed.");

        const firstState = await db.getFirstAsync<{
            status: string;
            lease_token: string | null;
            attempts: number;
        }>(
            `SELECT status, lease_token, attempts
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(firstState?.status === "processing", "Operation is not processing.");

        assert(firstState?.lease_token === leaseA, "First lease was not stored.");

        assert(firstState?.attempts === 1, "First attempt was not counted.");

        console.log("[Sync Lease Test] First claim PASSED");

        // PRUEBA 2: simular una interrupción.
        const recovered = await recoverInterruptedSyncOperations(userId);

        assert(recovered === 1, "Recovery failed.");

        const recoveredState = await db.getFirstAsync<{
            status: string;
            lease_token: string | null;
        }>(
            `SELECT status, lease_token
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(recoveredState?.status === "pending", "Operation did not return to pending.");

        assert(recoveredState?.lease_token === null, "Old lease was not cleared.");

        console.log("[Sync Lease Test] Lease invalidation PASSED");

        // PRUEBA 3: un nuevo intento reclama la operación.
        const secondClaim = await claimPendingSyncOperation(userId, operationId, leaseB);

        assert(secondClaim, "Second claim failed.");

        const secondState = await db.getFirstAsync<{
            status: string;
            lease_token: string | null;
            attempts: number;
        }>(
            `SELECT status, lease_token, attempts
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(secondState?.status === "processing", "Second attempt is not processing.");

        assert(secondState?.lease_token === leaseB, "Second lease was not stored.");

        assert(secondState?.attempts === 2, "Second attempt was not counted.");

        console.log("[Sync Lease Test] Second claim PASSED");

        // PRUEBA 4: el intento anterior no puede finalizar.
        const staleCompletion = await completeSyncOperation(userId, operationId, leaseA);

        assert(!staleCompletion, "Old lease completed the operation.");

        const staleFailure = await markSyncOperationFailed(userId, operationId, leaseA);

        assert(!staleFailure, "Old lease marked the operation as failed.");

        const stateAfterStaleCalls = await db.getFirstAsync<{
            status: string;
            lease_token: string | null;
        }>(
            `SELECT status, lease_token
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(
            stateAfterStaleCalls?.status === "processing" &&
                stateAfterStaleCalls.lease_token === leaseB,
            "Old lease changed the active attempt."
        );

        console.log("[Sync Lease Test] Stale response protection PASSED");

        // PRUEBA 5: solo el intento vigente puede completar.
        const completed = await completeSyncOperation(userId, operationId, leaseB);

        assert(completed, "Active lease could not complete.");

        const remaining = await db.getFirstAsync<{
            total: number;
        }>(
            `SELECT COUNT(*) AS total
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(remaining?.total === 0, "Completed operation was not removed.");

        console.log("[Sync Lease Test] Active completion PASSED");
    } finally {
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );
    }
}
