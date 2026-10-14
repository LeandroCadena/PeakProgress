import { getDatabase } from "../database";

export type RoutineRemoteState = "never_synced" | "exists" | "deleted" | "unknown";

export type RoutineRemoteMetadata = {
    routineId: string;
    remoteVersion: number | null;
    remoteState: RoutineRemoteState;
};

type RoutineRemoteMetadataRow = {
    id: string;
    remote_version: number | null;
    remote_state: RoutineRemoteState;
};

export async function getRoutineRemoteMetadata(params: {
    userId: string;
    routineId: string;
}): Promise<RoutineRemoteMetadata | null> {
    const { userId, routineId } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const db = await getDatabase();

    const row = await db.getFirstAsync<RoutineRemoteMetadataRow>(
        `SELECT id, remote_version, remote_state
             FROM local_routines
             WHERE id = ?
               AND user_id = ?`,
        [routineId, userId]
    );

    if (!row) {
        return null;
    }

    return {
        routineId: row.id,
        remoteVersion: row.remote_version,
        remoteState: row.remote_state,
    };
}
