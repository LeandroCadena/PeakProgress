import type { SyncOperation } from "../../database/repositories/syncQueueRepository";
import type { RoutineEditorSnapshot } from "../../store/routineEditorStore";

export const SYNC_PROTOCOL_VERSION = 1 as const;

export type RoutineSyncUpsert = {
    protocolVersion: typeof SYNC_PROTOCOL_VERSION;
    operationId: string;
    entityType: "routine";
    operationType: "upsert";
    entityId: string;
    snapshot: RoutineEditorSnapshot;
};

export type RoutineSyncDelete = {
    protocolVersion: typeof SYNC_PROTOCOL_VERSION;
    operationId: string;
    entityType: "routine";
    operationType: "delete";
    entityId: string;
};

export type RoutineSyncRequest = RoutineSyncUpsert | RoutineSyncDelete;

export type RoutineSyncResponse =
    | {
          success: true;
          operationId: string;
          outcome: "applied" | "already_applied";
      }
    | {
          success: false;
          operationId: string;
          errorCode: string;
          message: string;
          retryable: boolean;
      };

export type RoutineSyncOperationType = "upsert" | "delete";

export type ApplyRoutineSyncRequest = {
    operationId: string;
    routineId: string;
    operationType: RoutineSyncOperationType;
    expectedVersion: number | null;
    payload: unknown;
};

export type ApplyRoutineSyncResponse =
    | {
          status: "applied" | "already_applied";
          routineId: string;
          remoteVersion: number;
      }
    | {
          status: "conflict";
          routineId: string;
          remoteVersion: number;
      };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildRoutineSyncRequest(operation: SyncOperation): RoutineSyncRequest {
    if (operation.entity_type !== "routine") {
        throw new Error("Unsupported sync entity.");
    }

    let payload: unknown;

    try {
        payload = JSON.parse(operation.payload);
    } catch {
        throw new Error("Invalid sync operation payload.");
    }

    if (!isRecord(payload)) {
        throw new Error("Sync payload must be an object.");
    }

    if (operation.operation_type === "delete") {
        if (payload.routineId !== operation.entity_id) {
            throw new Error("Delete payload entity mismatch.");
        }

        return {
            protocolVersion: SYNC_PROTOCOL_VERSION,
            operationId: operation.id,
            entityType: "routine",
            operationType: "delete",
            entityId: operation.entity_id,
        };
    }

    if (operation.operation_type === "upsert") {
        if (
            payload.routineId !== operation.entity_id ||
            typeof payload.name !== "string" ||
            !Array.isArray(payload.exercises) ||
            !isRecord(payload.setsByExerciseId)
        ) {
            throw new Error("Invalid routine snapshot.");
        }

        return {
            protocolVersion: SYNC_PROTOCOL_VERSION,
            operationId: operation.id,
            entityType: "routine",
            operationType: "upsert",
            entityId: operation.entity_id,
            snapshot: payload as RoutineEditorSnapshot,
        };
    }

    throw new Error("Unsupported sync operation type.");
}
