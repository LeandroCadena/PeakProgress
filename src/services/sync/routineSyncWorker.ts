import {
    acknowledgeRoutineSyncOperation,
    claimPendingSyncOperation,
    getPendingSyncOperations,
    markSyncOperationConflict,
    markSyncOperationFailed,
    scheduleTransientSyncRetry,
    type SyncOperation,
} from "../../database/repositories/syncQueueRepository";

import { recoverRoutineConflictSnapshot } from "./routineConflictSnapshotService";
import { applyRoutineSyncOperation, RoutineSyncNetworkError, type RoutineSyncPayload } from "./routineSyncRpcService";

type WorkerResult = "idle" | "applied" | "conflict" | "failed" | "stale_claim" | "retry_scheduled";

const MAX_TRANSIENT_ATTEMPTS = 5;
const RETRY_BASE_MS = 30_000;


function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Convert a persisted editor snapshot to the RPC format, without reading live SQLite state. */
function parsePersistedPayload(
    operation: SyncOperation
): RoutineSyncPayload | Record<string, never> {
    const parsed: unknown = JSON.parse(operation.payload);
    if (!isRecord(parsed) || parsed.routineId !== operation.entity_id) {
        throw new Error("Queued payload does not match its routine ID.");
    }
    if (operation.operation_type === "delete") return {};

    if (
        typeof parsed.name !== "string" ||
        !parsed.name.trim() ||
        !Array.isArray(parsed.exercises) ||
        !isRecord(parsed.setsByExerciseId)
    ) {
        throw new Error("Invalid queued upsert snapshot.");
    }

    const exerciseIds = new Set<string>();
    const setIds = new Set<string>();
    const exercises: RoutineSyncPayload["exercises"] = [];
    const setsByExerciseId: RoutineSyncPayload["setsByExerciseId"] = {};

    for (const raw of parsed.exercises) {
        if (
            !isRecord(raw) ||
            typeof raw.id !== "string" ||
            typeof raw.exercise_id !== "string" ||
            raw.routine_id !== operation.entity_id ||
            !Number.isSafeInteger(raw.position) ||
            !Number.isSafeInteger(raw.rest_seconds) ||
            (raw.exercise_rest_seconds != null &&
                !Number.isSafeInteger(raw.exercise_rest_seconds)) ||
            exerciseIds.has(raw.id)
        ) {
            throw new Error("Invalid or duplicate queued exercise.");
        }
        exerciseIds.add(raw.id);
        exercises.push({
            id: raw.id,
            exercise_id: raw.exercise_id,
            position: raw.position as number,
            rest_seconds: raw.rest_seconds as number,
            exercise_rest_seconds: (raw.exercise_rest_seconds ?? null) as number | null,
            notes: typeof raw.notes === "string" ? raw.notes : null,
        });

        const rawSets = parsed.setsByExerciseId[raw.id];
        if (rawSets !== undefined && !Array.isArray(rawSets)) {
            throw new Error("Invalid queued set group.");
        }
        setsByExerciseId[raw.id] = [];
        for (const set of (rawSets ?? []) as unknown[]) {
            if (
                !isRecord(set) ||
                typeof set.id !== "string" ||
                set.routine_exercise_id !== raw.id ||
                !Number.isSafeInteger(set.reps) ||
                (set.weight !== null && typeof set.weight !== "number") ||
                (typeof set.weight === "number" && !Number.isFinite(set.weight)) ||
                setIds.has(set.id)
            ) {
                throw new Error("Invalid or duplicate queued set.");
            }
            setIds.add(set.id);
            setsByExerciseId[raw.id].push({
                id: set.id,
                routine_exercise_id: raw.id,
                reps: set.reps as number,
                weight: (set.weight ?? null) as number | null,
                is_pr: set.is_pr === true,
            });
        }
    }
    for (const key of Object.keys(parsed.setsByExerciseId)) {
        if (!exerciseIds.has(key)) throw new Error("Orphan queued set group.");
    }
    return { routineId: operation.entity_id, name: parsed.name, exercises, setsByExerciseId };
}

/** Processes at most one eligible operation; invoke only after authentication and migration verification. */
export async function processOneRoutineSyncOperation(
    userId: string,
    leaseToken: string
): Promise<WorkerResult> {
    if (!userId.trim() || !leaseToken.trim())
        throw new Error("User ID and lease token are required.");
    const [operation] = await getPendingSyncOperations(userId, 1);
    if (!operation) return "idle";
    if (operation.entity_type !== "routine") throw new Error("Unsupported sync entity.");

    const claimed = await claimPendingSyncOperation(userId, operation.id, leaseToken);
    if (!claimed) return "stale_claim";

    try {
        const payload = parsePersistedPayload(operation);
        const response = await applyRoutineSyncOperation({
            operationId: operation.id,
            routineId: operation.entity_id,
            operationType: operation.operation_type,
            expectedVersion: operation.expected_version,
            payload,
        });
        if (response.routine_id !== operation.entity_id) {
            throw new Error("RPC returned a different routine ID.");
        }

        if (response.status === "applied" || response.status === "already_applied") {
            const acknowledged = await acknowledgeRoutineSyncOperation({
                userId,
                operationId: operation.id,
                leaseToken,
                remoteVersion: response.remote_version,
            });
            if (!acknowledged) throw new Error("Sync acknowledgement lost its lease.");
            return "applied";
        }

        if (response.status === "conflict" && response.remote_version !== null) {
            const registered = await markSyncOperationConflict({
                userId,
                operationId: operation.id,
                leaseToken,
                remoteVersion: response.remote_version,
                remoteSnapshot: null,
            });
            if (!registered) throw new Error("Sync conflict lost its lease.");

            try {
                await recoverRoutineConflictSnapshot({
                    userId,
                    routineId: operation.entity_id,
                    operationId: operation.id,
                    conflictVersion: response.remote_version,
                });
            } catch (error) {
                console.warn("Could not retrieve remote conflict snapshot:", error);
            }

            return "conflict";
        }

        // version_unknown or conflict with no remote version requires manual reconciliation.
        // Do not acknowledge, alter expected_version or generate a new operation ID.
        throw new Error(`Sync requires reconciliation: ${response.status}`);
    } catch (error) {
        // The claim increments attempts in SQLite; the fetched operation predates that claim.
        const attemptNumber = operation.attempts + 1;
        if (error instanceof RoutineSyncNetworkError && attemptNumber < MAX_TRANSIENT_ATTEMPTS) {
            const delayMs = RETRY_BASE_MS * 2 ** (attemptNumber - 1);
            const scheduled = await scheduleTransientSyncRetry(
                userId, operation.id, leaseToken, delayMs
            );
            if (!scheduled) throw new Error("Transient retry lost its lease.");
            return "retry_scheduled";
        }
        const marked = await markSyncOperationFailed(userId, operation.id, leaseToken);
        if (!marked) throw new Error(`Failed to preserve claimed operation: ${String(error)}`);
        return "failed";
    }
}
