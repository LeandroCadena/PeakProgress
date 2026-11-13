import {
    bundledMuscles,
    bundledRegions,
    getBundledExercise,
    getBundledExercises,
} from "../database/bundledCatalog";
import {
    getCatalogSyncVersion,
    getLocalExerciseDetail,
    getLocalExercisesByFilter,
    getLocalMuscleRegions,
    getLocalMuscles,
} from "../database/catalogRepository";
import type { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

export async function getCatalogAvailability(): Promise<"pending" | "available"> {
    const version = await getCatalogSyncVersion();
    return version > 0 ? "available" : "pending";
}

export async function getMuscles(): Promise<Muscle[]> {
    return (await getCatalogAvailability()) === "pending" ? bundledMuscles : getLocalMuscles();
}

export async function getMuscleRegions(): Promise<MuscleRegion[]> {
    return (await getCatalogAvailability()) === "pending"
        ? bundledRegions
        : getLocalMuscleRegions();
}

export async function getExercisesByFilter(params: {
    filterMode: FilterMode;
    selectedIds: string[];
}): Promise<Exercise[]> {
    return (await getCatalogAvailability()) === "pending"
        ? getBundledExercises(params)
        : getLocalExercisesByFilter(params);
}

export async function getExerciseDetail(exerciseId: string) {
    return (await getCatalogAvailability()) === "pending"
        ? getBundledExercise(exerciseId)
        : getLocalExerciseDetail(exerciseId);
}
