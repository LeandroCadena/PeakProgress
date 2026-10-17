import {
    applyRemoteRoutineDeletion,
    getLocalRoutineSyncMetadata,
    getLocalRoutines,
} from "../../database/repositories/routineRepository";

import { getRemoteRoutineVersion } from "./routineRemoteVersionService";

export async function syncRemoteRoutineDeletions(
    userId: string
): Promise<{ applied: number; skipped: number; failed: number }> {
    if (!userId.trim()) {
        throw new Error("User ID is required.");
    }

    const routines = await getLocalRoutines(userId);
    const result = { applied: 0, skipped: 0, failed: 0 };

    for (const routine of routines) {
        try {
            const local = await getLocalRoutineSyncMetadata({
                userId,
                routineId: routine.id,
            });

            if (!local || local.isDeleted || local.syncStatus !== "synced") {
                result.skipped += 1;
                continue;
            }

            const remote = await getRemoteRoutineVersion({
                userId,
                routineId: routine.id,
            });

            if (!remote?.isDeleted) {
                result.skipped += 1;
                continue;
            }

            const applied = await applyRemoteRoutineDeletion({
                userId,
                routineId: routine.id,
                remoteVersion: remote.version,
            });

            if (applied) result.applied += 1;
            else result.skipped += 1;
        } catch (error) {
            result.failed += 1;
            console.warn(`Could not reconcile remote deletion ${routine.id}:`, error);
        }
    }

    return result;
}
