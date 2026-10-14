import { supabase } from "../supabase";

export type RemoteRoutineVersion = {
    routineId: string;
    version: number;
    isDeleted: boolean;
};

export async function getRemoteRoutineVersion(params: {
    userId: string;
    routineId: string;
}): Promise<RemoteRoutineVersion | null> {
    const { userId, routineId } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const { data, error } = await supabase.rpc("get_routine_sync_version", {
        p_routine_id: routineId,
    });

    if (error) {
        throw error;
    }

    const row = data?.[0];

    if (!row) {
        return null;
    }

    if (row.routine_id !== routineId) {
        throw new Error("Remote routine ID mismatch.");
    }

    if (typeof row.is_deleted !== "boolean") {
        throw new Error("Invalid remote routine deletion status.");
    }

    const version = Number(row.version);

    if (!Number.isSafeInteger(version) || version < 0) {
        throw new Error("Invalid remote routine version.");
    }

    return {
        routineId: row.routine_id,
        version,
        isDeleted: row.is_deleted,
    };
}
