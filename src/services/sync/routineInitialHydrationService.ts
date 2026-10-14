import { hydrateLocalRoutine } from "../../database/repositories/routineRepository";
import { getVersionedRemoteRoutineSnapshot } from "./remoteRoutineSnapshotService";
import { getRoutineHydrationCandidates } from "./routineHydrationService";

export type InitialHydrationResult = {
    hydrated: number;
    skipped: number;
    failed: number;
};

/**
 * Imports missing remote routines without replacing local pending edits or tombstones.
 * Call only for the currently authenticated user, when network access is available.
 * Failure of an individual routine does not discard successfully hydrated routines.
 */
export async function hydrateMissingRemoteRoutines(
    userId: string
): Promise<InitialHydrationResult> {
    if (!userId.trim()) {
        throw new Error("User ID is required.");
    }

    const candidates = await getRoutineHydrationCandidates(userId);
    const result: InitialHydrationResult = { hydrated: 0, skipped: 0, failed: 0 };

    for (const candidate of candidates) {
        try {
            const remote = await getVersionedRemoteRoutineSnapshot({
                userId,
                routineId: candidate.routineId,
            });

            const saved = await hydrateLocalRoutine({
                userId,
                snapshot: remote.snapshot,
                remoteVersion: remote.remoteVersion,
            });

            if (saved) result.hydrated += 1;
            else result.skipped += 1;
        } catch (error) {
            result.failed += 1;
            console.warn(`Could not hydrate routine ${candidate.routineId}:`, error);
        }
    }

    return result;
}
