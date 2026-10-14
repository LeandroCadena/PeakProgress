import { getDatabase } from "./database";
import {
    claimPendingSyncOperation,
    completeSyncOperation,
    enqueueSyncOperation,
    getPendingSyncCount,
    markSyncOperationFailed,
    recoverInterruptedSyncOperations,
    retryFailedSyncOperation,
} from "./repositories/syncQueueRepository";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`[Sync State Test] ${message}`);
    }
}

export async function testSyncStateTransitions(): Promise<void> {
    const db = await getDatabase();

    const userId = "__sync_state_test_user__";
    const operationId = "__sync_state_test_operation__";

    const leaseToken = "__sync_state_test_lease__";

    try {
        // Limpiar un posible registro de una prueba anterior.
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
                entityId: "__sync_state_test_routine__",
                operationType: "upsert",
                payload: {
                    routineId: "__sync_state_test_routine__",
                    name: "Test Routine",
                },
            });
        });

        // PRUEBA 1: solo puede tomarse una vez.
        const firstClaim = await claimPendingSyncOperation(userId, operationId, leaseToken);

        const secondClaim = await claimPendingSyncOperation(userId, operationId, leaseToken);

        assert(firstClaim, "First claim failed.");
        assert(!secondClaim, "Duplicate claim was accepted.");

        console.log("[Sync State Test] Exclusive claim PASSED");

        // PRUEBA 2: processing -> failed -> pending.
        const markedFailed = await markSyncOperationFailed(userId, operationId, leaseToken);

        assert(markedFailed, "Failed transition was rejected.");

        const retried = await retryFailedSyncOperation(userId, operationId);

        assert(retried, "Retry transition was rejected.");

        assert((await getPendingSyncCount(userId)) === 1, "Operation did not return to pending.");

        console.log("[Sync State Test] Retry transition PASSED");

        // PRUEBA 3: recuperación de una interrupción.
        const claimedAgain = await claimPendingSyncOperation(userId, operationId, leaseToken);

        assert(claimedAgain, "Second claim failed.");

        const recovered = await recoverInterruptedSyncOperations(userId);

        assert(recovered === 1, "Interrupted operation was not recovered.");

        assert((await getPendingSyncCount(userId)) === 1, "Recovered operation is not pending.");

        console.log("[Sync State Test] Recovery PASSED");

        // PRUEBA 4: completar la operación.
        const finalClaim = await claimPendingSyncOperation(userId, operationId, leaseToken);

        assert(finalClaim, "Final claim failed.");

        const completed = await completeSyncOperation(userId, operationId, leaseToken);

        assert(completed, "Operation completion failed.");

        assert((await getPendingSyncCount(userId)) === 0, "Completed operation remains pending.");

        const remaining = await db.getFirstAsync<{ total: number }>(
            `SELECT COUNT(*) AS total
             FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );

        assert(remaining?.total === 0, "Completed operation still exists.");

        console.log("[Sync State Test] Completion PASSED");
    } finally {
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE id = ? AND user_id = ?`,
            [operationId, userId]
        );
    }
}
