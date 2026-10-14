import * as Crypto from "expo-crypto";

import { recoverInterruptedSyncOperations } from "../../database/repositories/syncQueueRepository";

import { processOneRoutineSyncOperation } from "./routineSyncWorker";

const MAX_OPERATIONS_PER_PASS = 50;
const runningUsers = new Set<string>();
const recoveredUsers = new Set<string>();

/** A single-flight, bounded drain. Only confirmed transport failures are retried. */
export async function drainRoutineSyncQueue(userId: string): Promise<void> {
    if (!userId.trim() || runningUsers.has(userId)) return;
    runningUsers.add(userId);
    try {
        // Only recover once per JS runtime: recovering on every foreground event
        // could steal the lease of a currently in-flight request.
        if (!recoveredUsers.has(userId)) {
            await recoverInterruptedSyncOperations(userId);
            recoveredUsers.add(userId);
        }

        for (let index = 0; index < MAX_OPERATIONS_PER_PASS; index += 1) {
            const leaseToken = Crypto.randomUUID();
            const outcome = await processOneRoutineSyncOperation(userId, leaseToken);
            if (outcome === "idle" || outcome === "failed" || outcome === "stale_claim" || outcome === "retry_scheduled") break;
            // Conflicts are persisted by the worker; other independent routines can proceed.
        }
    } finally {
        runningUsers.delete(userId);
    }
}
