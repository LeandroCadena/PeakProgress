import { getRoutines } from "../routineService";

import { getLocalRoutineSyncMetadata } from "../../database/repositories/routineRepository";

export type RoutineHydrationCandidate = {
    routineId: string;
    name: string;
};

export async function getRoutineHydrationCandidates(
    userId: string
): Promise<RoutineHydrationCandidate[]> {
    if (!userId.trim()) {
        throw new Error("User ID is required.");
    }

    const remoteRoutines = await getRoutines();

    const candidates: RoutineHydrationCandidate[] = [];

    for (const routine of remoteRoutines) {
        const metadata = await getLocalRoutineSyncMetadata({
            userId,
            routineId: routine.id,
        });

        // Si ya existe localmente, no lo sobrescribimos
        // durante esta primera etapa.
        if (metadata) {
            continue;
        }

        candidates.push({
            routineId: routine.id,
            name: routine.name,
        });
    }

    return candidates;
}
