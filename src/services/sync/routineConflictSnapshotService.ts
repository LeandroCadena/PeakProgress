import { attachRemoteSnapshotToConflict } from "../../database/repositories/syncQueueRepository";

import { getVersionedRemoteRoutineSnapshot } from "./remoteRoutineSnapshotService";

export async function recoverRoutineConflictSnapshot(params: {
    userId: string;
    routineId: string;
    operationId: string;
    conflictVersion: number;
}): Promise<boolean> {
    const { userId, routineId, operationId, conflictVersion } = params;

    const remote = await getVersionedRemoteRoutineSnapshot({
        userId,
        routineId,
    });

    if (remote.remoteVersion !== conflictVersion) {
        return false;
    }

    return attachRemoteSnapshotToConflict({
        userId,
        operationId,
        remoteVersion: conflictVersion,
        snapshot: remote.snapshot,
    });
}
