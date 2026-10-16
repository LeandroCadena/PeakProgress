import {
    getCatalogSyncVersion,
    getLocalExerciseDetail,
    getLocalExercisesByFilter,
    getLocalMuscleRegions,
    getLocalMuscles,
} from "../database/catalogRepository";
import type { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

export class CatalogNotDownloadedError extends Error {
    constructor() {
        super("Exercise catalog has not been downloaded yet.");
        this.name = "CatalogNotDownloadedError";
    }
}

export async function getCatalogAvailability(): Promise<"pending" | "available"> {
    const version = await getCatalogSyncVersion();
    return version > 0 ? "available" : "pending";
}

async function ensureCatalogAvailable(): Promise<void> {
    if ((await getCatalogAvailability()) === "pending") {
        throw new CatalogNotDownloadedError();
    }
}

export async function getMuscles(): Promise<Muscle[]> {
    await ensureCatalogAvailable();
    return getLocalMuscles();
}

export async function getMuscleRegions(): Promise<MuscleRegion[]> {
    await ensureCatalogAvailable();
    return getLocalMuscleRegions();
}

export async function getExercisesByFilter(params: {
    filterMode: FilterMode;
    selectedIds: string[];
}): Promise<Exercise[]> {
    await ensureCatalogAvailable();
    return getLocalExercisesByFilter(params);
}

export async function getExerciseDetail(exerciseId: string) {
    await ensureCatalogAvailable();
    return getLocalExerciseDetail(exerciseId);
}
