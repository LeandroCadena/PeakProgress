import { getDatabase } from "./database";

import {
    claimPendingSyncOperation,
    completeSyncOperation,
    enqueueSyncOperation,
    getPendingSyncOperations,
    markSyncOperationFailed,
    retryFailedSyncOperation,
} from "./repositories/syncQueueRepository";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`[Sync Order Test] ${message}`);
    }
}

export async function testSyncOperationOrder(): Promise<void> {
    const db = await getDatabase();

    const userId = "__sync_order_test_user__";
    const routineA = "__sync_order_routine_A__";
    const routineB = "__sync_order_routine_B__";

    const operationA1 = "__sync_order_A1__";
    const operationA2 = "__sync_order_A2__";
    const operationA3 = "__sync_order_A3__";
    const operationB1 = "__sync_order_B1__";

    const operationIds = [operationA1, operationA2, operationA3, operationB1];

    const leaseA1 = "__sync_order_lease_A1__";
    const leaseA2 = "__sync_order_lease_A2__";
    const leaseA3 = "__sync_order_lease_A3__";
    const leaseB1 = "__sync_order_lease_B1__";

    async function cleanup(): Promise<void> {
        for (const operationId of operationIds) {
            await db.runAsync(
                `DELETE FROM sync_operations
                 WHERE id = ? AND user_id = ?`,
                [operationId, userId]
            );
        }
    }

    try {
        await cleanup();

        // Insertar operaciones en un orden conocido.
        // Los timestamps son iguales para probar el desempate por rowid.
        await db.withExclusiveTransactionAsync(async (tx) => {
            await enqueueSyncOperation(tx, {
                id: operationA1,
                userId,
                entityType: "routine",
                entityId: routineA,
                operationType: "upsert",
                payload: { routineId: routineA, name: "Version 1" },
            });

            await enqueueSyncOperation(tx, {
                id: operationA2,
                userId,
                entityType: "routine",
                entityId: routineA,
                operationType: "upsert",
                payload: { routineId: routineA, name: "Version 2" },
            });

            await enqueueSyncOperation(tx, {
                id: operationA3,
                userId,
                entityType: "routine",
                entityId: routineA,
                operationType: "delete",
                payload: { routineId: routineA },
            });

            await enqueueSyncOperation(tx, {
                id: operationB1,
                userId,
                entityType: "routine",
                entityId: routineB,
                operationType: "upsert",
                payload: { routineId: routineB, name: "Other routine" },
            });
        });

        // Forzar timestamps iguales para probar el desempate.
        await db.runAsync(
            `UPDATE sync_operations
             SET created_at = ?
             WHERE user_id = ?
               AND id IN (?, ?, ?, ?)`,
            ["2026-01-01T00:00:00.000Z", userId, ...operationIds]
        );

        // PRUEBA 1: solamente A1 y B1 son elegibles.
        const initialPending = await getPendingSyncOperations(userId);

        const initialIds = initialPending.map((op) => op.id);

        assert(initialIds.includes(operationA1), "First operation of routine A is missing.");

        assert(initialIds.includes(operationB1), "Independent routine B is missing.");

        assert(
            !initialIds.includes(operationA2) && !initialIds.includes(operationA3),
            "Later operations were returned too early."
        );

        console.log("[Sync Order Test] Pending selection PASSED");

        // PRUEBA 2: A2 y A3 no pueden reclamarse.
        assert(
            !(await claimPendingSyncOperation(userId, operationA2, leaseA2)),
            "A2 was claimed before A1."
        );

        assert(
            !(await claimPendingSyncOperation(userId, operationA3, leaseA3)),
            "A3 was claimed before A1."
        );

        console.log("[Sync Order Test] Out-of-order claims blocked PASSED");

        // PRUEBA 3: A1 y B1 pueden procesarse independientemente.
        assert(
            await claimPendingSyncOperation(userId, operationA1, leaseA1),
            "A1 could not be claimed."
        );

        assert(
            await claimPendingSyncOperation(userId, operationB1, leaseB1),
            "Independent routine B could not be claimed."
        );

        assert(
            await completeSyncOperation(userId, operationB1, leaseB1),
            "B1 could not be completed."
        );

        assert(
            !(await claimPendingSyncOperation(userId, operationA2, leaseA2)),
            "A2 bypassed A1 while processing."
        );

        console.log("[Sync Order Test] Independent routines PASSED");

        // PRUEBA 4: una operación fallida bloquea las posteriores.
        assert(
            await markSyncOperationFailed(userId, operationA1, leaseA1),
            "A1 could not be marked as failed."
        );

        assert(
            !(await claimPendingSyncOperation(userId, operationA2, leaseA2)),
            "A2 bypassed failed A1."
        );

        console.log("[Sync Order Test] Failed operation blocking PASSED");

        // PRUEBA 5: reintentar y completar A1 desbloquea A2.
        assert(await retryFailedSyncOperation(userId, operationA1), "A1 could not be retried.");

        const retryLeaseA1 = "__sync_order_retry_A1__";

        assert(
            await claimPendingSyncOperation(userId, operationA1, retryLeaseA1),
            "A1 could not be claimed again."
        );

        assert(
            await completeSyncOperation(userId, operationA1, retryLeaseA1),
            "A1 could not be completed."
        );

        assert(
            await claimPendingSyncOperation(userId, operationA2, leaseA2),
            "A2 did not unlock after A1."
        );

        assert(!(await claimPendingSyncOperation(userId, operationA3, leaseA3)), "A3 bypassed A2.");

        assert(
            await completeSyncOperation(userId, operationA2, leaseA2),
            "A2 could not be completed."
        );

        assert(
            await claimPendingSyncOperation(userId, operationA3, leaseA3),
            "A3 did not unlock after A2."
        );

        assert(
            await completeSyncOperation(userId, operationA3, leaseA3),
            "A3 could not be completed."
        );

        console.log("[Sync Order Test] Sequential processing PASSED");

        const remaining = await db.getFirstAsync<{ total: number }>(
            `SELECT COUNT(*) AS total
             FROM sync_operations
             WHERE user_id = ?
               AND id IN (?, ?, ?, ?)`,
            [userId, ...operationIds]
        );

        assert(remaining?.total === 0, "Some test operations remain in the queue.");

        console.log("[Sync Order Test] Cleanup verification PASSED");
    } finally {
        await cleanup();
    }
}
