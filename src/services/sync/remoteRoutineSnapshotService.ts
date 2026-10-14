import type { RoutineEditorSnapshot } from "../../store/routineEditorStore";
import { getRoutineExercises, getRoutineExerciseSetsByRoutineId } from "../routineService";
import { supabase } from "../supabase";

import { getRemoteRoutineVersion } from "./routineRemoteVersionService";

export async function getRemoteRoutineSnapshot(params: {
    routineId: string;
    name: string;
}): Promise<RoutineEditorSnapshot> {
    const { routineId, name } = params;

    if (!routineId.trim()) {
        throw new Error("Routine ID is required.");
    }

    if (!name.trim()) {
        throw new Error("Routine name is required.");
    }

    const [exercises, setsByExerciseId] = await Promise.all([
        getRoutineExercises(routineId),
        getRoutineExerciseSetsByRoutineId(routineId),
    ]);

    for (const exercise of exercises) {
        if (exercise.routine_id !== routineId) {
            throw new Error("Remote exercise belongs to another routine.");
        }
    }

    const exerciseIds = new Set(exercises.map((exercise) => exercise.id));

    for (const [exerciseId, sets] of Object.entries(setsByExerciseId)) {
        if (!exerciseIds.has(exerciseId)) {
            throw new Error("Remote sets reference an unknown exercise.");
        }

        for (const set of sets) {
            if (set.routine_exercise_id !== exerciseId) {
                throw new Error("Remote set belongs to another exercise.");
            }
        }
    }

    return {
        routineId,
        name,
        exercises,
        setsByExerciseId,
    };
}

export async function getVersionedRemoteRoutineSnapshot(params: {
    userId: string;
    routineId: string;
}): Promise<{
    snapshot: RoutineEditorSnapshot;
    remoteVersion: number;
}> {
    const { userId, routineId } = params;

    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    const before = await getRemoteRoutineVersion({
        userId,
        routineId,
    });

    if (!before || before.isDeleted) {
        throw new Error("Remote routine is missing or deleted.");
    }

    const name = await getRemoteRoutineName(routineId);

    const snapshot = await getRemoteRoutineSnapshot({
        routineId,
        name,
    });

    const after = await getRemoteRoutineVersion({
        userId,
        routineId,
    });

    if (!after || after.isDeleted || after.version !== before.version) {
        throw new Error("Remote routine changed during hydration.");
    }

    return {
        snapshot,
        remoteVersion: after.version,
    };
}

async function getRemoteRoutineName(routineId: string): Promise<string> {
    const { data, error } = await supabase
        .from("routines")
        .select("name")
        .eq("id", routineId)
        .single();

    if (error) {
        throw error;
    }

    if (!data?.name?.trim()) {
        throw new Error("Remote routine name is missing.");
    }

    return data.name;
}
