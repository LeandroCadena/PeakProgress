import type * as SQLite from "expo-sqlite";

import { getDatabase } from "../database";

export type SyncEntityType = "routine";

export type SyncOperationType = "upsert" | "delete";

export type SyncOperationStatus = "pending" | "processing" | "failed" | "conflict";

export type SyncOperation = {
    id: string;
    user_id: string;
    entity_type: SyncEntityType;
    entity_id: string;
    operation_type: SyncOperationType;
    payload: string;
    status: SyncOperationStatus;
    attempts: number;
    created_at: string;
    updated_at: string;
    lease_token: string | null;
    expected_version: number | null;
};

export type EnqueueSyncOperationParams = {
    id: string;
    userId: string;
    entityType: SyncEntityType;
    entityId: string;
    operationType: SyncOperationType;
    payload: unknown;
    expectedVersion?: number | null;
};

type SyncTransaction = Pick<SQLite.SQLiteDatabase, "runAsync">;

export async function enqueueSyncOperation(
    tx: SyncTransaction,
    params: EnqueueSyncOperationParams
): Promise<void> {
    if (!params.id.trim() || !params.userId.trim() || !params.entityId.trim()) {
        throw new Error("Sync operation ID, user ID and entity ID are required.");
    }

    const expectedVersion = params.expectedVersion ?? null;

    if (
        expectedVersion !== null &&
        (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0)
    ) {
        throw new Error("Expected version must be a non-negative safe integer.");
    }

    const now = new Date().toISOString();
    const payload = JSON.stringify(params.payload);

    if (payload === undefined) {
        throw new Error("Sync payload must be JSON serializable.");
    }

    await tx.runAsync(
        `INSERT INTO sync_operations (
            id,
            user_id,
            entity_type,
            entity_id,
            operation_type,
            payload,
            status,
            attempts,
            created_at,
            updated_at,
            expected_version
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)`,
        [
            params.id,
            params.userId,
            params.entityType,
            params.entityId,
            params.operationType,
            payload,
            now,
            now,
            expectedVersion,
        ]
    );
}

export async function replacePendingRoutineUpsert(
    tx: Pick<SQLite.SQLiteDatabase, "runAsync">,
    params: {
        userId: string;
        routineId: string;
        snapshot: unknown;
    }
): Promise<boolean> {
    const { userId, routineId, snapshot } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const payload = JSON.stringify(snapshot);

    if (payload === undefined) {
        throw new Error("Snapshot must be JSON serializable.");
    }

    const result = await tx.runAsync(
        `UPDATE sync_operations
         SET payload = ?,
             updated_at = ?
         WHERE user_id = ?
           AND entity_type = 'routine'
           AND entity_id = ?
           AND operation_type = 'upsert'
           AND status = 'pending'
           AND attempts = 0
           AND NOT EXISTS (
               SELECT 1
               FROM sync_operations AS other
               WHERE other.user_id = sync_operations.user_id
                 AND other.entity_type = sync_operations.entity_type
                 AND other.entity_id = sync_operations.entity_id
                 AND other.id <> sync_operations.id
           )`,
        [payload, new Date().toISOString(), userId, routineId]
    );

    if (result.changes > 1) {
        throw new Error("Multiple pending operations were unexpectedly updated.");
    }

    return result.changes === 1;
}

export async function getPendingSyncOperations(
    userId: string,
    limit = 50
): Promise<SyncOperation[]> {
    if (!userId.trim()) {
        throw new Error("A user ID is required.");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
        throw new Error("Sync operation limit must be between 1 and 500.");
    }

    const db = await getDatabase();

    return db.getAllAsync<SyncOperation>(
        `SELECT
            current.id,
            current.user_id,
            current.entity_type,
            current.entity_id,
            current.operation_type,
            current.payload,
            current.status,
            current.attempts,
            current.created_at,
            current.updated_at,
            current.lease_token,
            current.expected_version
        FROM sync_operations AS current
         WHERE current.user_id = ?
           AND current.status = 'pending'
           AND NOT EXISTS (
               SELECT 1
               FROM sync_operations AS earlier
               WHERE earlier.user_id = current.user_id
                 AND earlier.entity_type = current.entity_type
                 AND earlier.entity_id = current.entity_id
                 AND (
                     earlier.created_at < current.created_at
                     OR (
                         earlier.created_at = current.created_at
                         AND earlier.rowid < current.rowid
                     )
                 )
           )
         ORDER BY current.created_at ASC, current.rowid ASC
         LIMIT ?`,
        [userId, limit]
    );
}

export async function getPendingSyncCount(userId: string): Promise<number> {
    if (!userId.trim()) {
        throw new Error("A user ID is required.");
    }

    const db = await getDatabase();

    const result = await db.getFirstAsync<{
        total: number;
    }>(
        `SELECT COUNT(*) AS total
         FROM sync_operations
         WHERE user_id = ?
           AND status = 'pending'`,
        [userId]
    );

    return result?.total ?? 0;
}

export async function claimPendingSyncOperation(
    userId: string,
    operationId: string,
    leaseToken: string
): Promise<boolean> {
    if (!userId.trim() || !operationId.trim() || !leaseToken.trim()) {
        throw new Error("User ID, operation ID and lease token are required.");
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    const result = await db.runAsync(
        `UPDATE sync_operations
         SET status = 'processing',
             attempts = attempts + 1,
             lease_token = ?,
             updated_at = ?
         WHERE id = ?
           AND user_id = ?
           AND status = 'pending'
           AND NOT EXISTS (
               SELECT 1
               FROM sync_operations AS earlier
               WHERE earlier.user_id = sync_operations.user_id
                 AND earlier.entity_type = sync_operations.entity_type
                 AND earlier.entity_id = sync_operations.entity_id
                 AND (
                     earlier.created_at < sync_operations.created_at
                     OR (
                         earlier.created_at = sync_operations.created_at
                         AND earlier.rowid < sync_operations.rowid
                     )
                 )
           )`,
        [leaseToken, now, operationId, userId]
    );

    return result.changes === 1;
}

export async function markSyncOperationFailed(
    userId: string,
    operationId: string,
    leaseToken: string
): Promise<boolean> {
    if (!userId.trim() || !operationId.trim() || !leaseToken.trim()) {
        throw new Error("User ID, operation ID and lease token are required.");
    }

    const db = await getDatabase();

    const result = await db.runAsync(
        `UPDATE sync_operations
         SET status = 'failed',
             lease_token = NULL,
             updated_at = ?
         WHERE id = ?
           AND user_id = ?
           AND status = 'processing'
           AND lease_token = ?`,
        [new Date().toISOString(), operationId, userId, leaseToken]
    );

    return result.changes === 1;
}

export async function retryFailedSyncOperation(
    userId: string,
    operationId: string
): Promise<boolean> {
    if (!userId.trim() || !operationId.trim()) {
        throw new Error("User ID and operation ID are required.");
    }

    const db = await getDatabase();

    const result = await db.runAsync(
        `UPDATE sync_operations
         SET status = 'pending',
             updated_at = ?
         WHERE id = ?
           AND user_id = ?
           AND status = 'failed'`,
        [new Date().toISOString(), operationId, userId]
    );

    return result.changes === 1;
}

export async function recoverInterruptedSyncOperations(userId: string): Promise<number> {
    if (!userId.trim()) {
        throw new Error("A user ID is required.");
    }

    const db = await getDatabase();

    const result = await db.runAsync(
        `UPDATE sync_operations
         SET status = 'pending',
             lease_token = NULL,
             updated_at = ?
         WHERE user_id = ?
           AND status = 'processing'`,
        [new Date().toISOString(), userId]
    );

    return result.changes;
}

export async function completeSyncOperation(
    userId: string,
    operationId: string,
    leaseToken: string
): Promise<boolean> {
    if (!userId.trim() || !operationId.trim() || !leaseToken.trim()) {
        throw new Error("User ID, operation ID and lease token are required.");
    }

    const db = await getDatabase();

    const result = await db.runAsync(
        `DELETE FROM sync_operations
         WHERE id = ?
           AND user_id = ?
           AND status = 'processing'
           AND lease_token = ?`,
        [operationId, userId, leaseToken]
    );

    return result.changes === 1;
}

export type RegisterSyncConflictParams = {
    userId: string;
    operationId: string;
    leaseToken: string;
    remoteVersion: number;
    remoteSnapshot: unknown | null;
};

export async function markSyncOperationConflict({
    userId,
    operationId,
    leaseToken,
    remoteVersion,
    remoteSnapshot,
}: RegisterSyncConflictParams): Promise<boolean> {
    if (!userId.trim() || !operationId.trim() || !leaseToken.trim()) {
        throw new Error("User ID, operation ID and lease token are required.");
    }

    if (!Number.isSafeInteger(remoteVersion) || remoteVersion < 0) {
        throw new Error("Invalid remote routine version.");
    }

    const serializedSnapshot = remoteSnapshot === null ? null : JSON.stringify(remoteSnapshot);

    if (remoteSnapshot !== null && serializedSnapshot === undefined) {
        throw new Error("Remote snapshot must be JSON serializable.");
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    let registered = false;

    await db.withExclusiveTransactionAsync(async (tx) => {
        const operation = await tx.getFirstAsync<{
            entity_type: string;
            entity_id: string;
        }>(
            `SELECT entity_type, entity_id
             FROM sync_operations
             WHERE id = ?
               AND user_id = ?
               AND status = 'processing'
               AND lease_token = ?`,
            [operationId, userId, leaseToken]
        );

        if (!operation) {
            return;
        }

        if (operation.entity_type !== "routine") {
            throw new Error("Unsupported sync entity type.");
        }

        const routine = await tx.getFirstAsync<{
            id: string;
        }>(
            `SELECT id
             FROM local_routines
             WHERE id = ?
               AND user_id = ?`,
            [operation.entity_id, userId]
        );

        if (!routine) {
            throw new Error("Local routine not found for sync conflict.");
        }

        const operationResult = await tx.runAsync(
            `UPDATE sync_operations
             SET status = 'conflict',
                 lease_token = NULL,
                 updated_at = ?
             WHERE id = ?
               AND user_id = ?
               AND status = 'processing'
               AND lease_token = ?`,
            [now, operationId, userId, leaseToken]
        );

        if (operationResult.changes !== 1) {
            return;
        }

        const routineResult = await tx.runAsync(
            `UPDATE local_routines
             SET sync_status = 'conflict',
                 updated_at = ?
             WHERE id = ?
               AND user_id = ?`,
            [now, operation.entity_id, userId]
        );

        if (routineResult.changes !== 1) {
            throw new Error("Could not mark local routine as conflicting.");
        }

        await tx.runAsync(
            `INSERT INTO routine_sync_conflicts (
                operation_id,
                user_id,
                routine_id,
                remote_version,
                remote_snapshot,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [operationId, userId, operation.entity_id, remoteVersion, serializedSnapshot, now]
        );

        registered = true;
    });

    return registered;
}
