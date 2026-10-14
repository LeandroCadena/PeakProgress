import { supabase } from "../supabase";

export type RoutineSyncOperationType = "upsert" | "delete";

export interface RoutineSyncPayload {
    routineId: string;
    name: string;
    exercises: {
        id: string;
        exercise_id: string;
        position: number;
        rest_seconds: number;
        exercise_rest_seconds: number | null;
        notes: string | null;
    }[];
    setsByExerciseId: Record<
        string,
        {
            id: string;
            routine_exercise_id: string;
            reps: number;
            weight: number | null;
            is_pr: boolean;
        }[]
    >;
}

export type RoutineSyncRpcResult =
    | {
          status: "applied" | "already_applied";
          routine_id: string;
          remote_version: number;
      }
    | {
          status: "conflict" | "version_unknown";
          routine_id: string;
          remote_version: number | null;
      };

export interface ApplyRoutineSyncInput {
    operationId: string;
    routineId: string;
    operationType: RoutineSyncOperationType;
    expectedVersion: number | null;
    payload: RoutineSyncPayload | Record<string, never>;
}

export async function applyRoutineSyncOperation(
    input: ApplyRoutineSyncInput
): Promise<RoutineSyncRpcResult> {
    const { data, error } = await supabase.rpc("apply_routine_sync_operation", {
        p_operation_id: input.operationId,
        p_routine_id: input.routineId,
        p_operation_type: input.operationType,
        p_expected_version: input.expectedVersion,
        p_payload: input.payload,
    });

    if (error) {
        throw new Error(`Routine sync RPC failed: ${error.message}`);
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid routine sync RPC response");
    }

    const result = data as Record<string, unknown>;

    if (
        typeof result.routine_id !== "string" ||
        !["applied", "already_applied", "conflict", "version_unknown"].includes(
            String(result.status)
        )
    ) {
        throw new Error("Unexpected routine sync RPC response");
    }

    if (
        result.remote_version !== null &&
        (typeof result.remote_version !== "number" ||
            !Number.isSafeInteger(result.remote_version) ||
            result.remote_version < 0)
    ) {
        throw new Error("Invalid remote routine version");
    }

    if (
        (result.status === "applied" || result.status === "already_applied") &&
        result.remote_version === null
    ) {
        throw new Error("Applied operation has no remote version");
    }

    return result as RoutineSyncRpcResult;
}
