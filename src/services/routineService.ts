import * as Crypto from "expo-crypto";

import {
    deleteLocalRoutine,
    getLocalRoutine,
    saveLocalRoutine,
} from "../database/repositories/routineRepository";
import type { RoutineEditorSnapshot } from "../store/routineEditorStore";
import { Routine, RoutineExercise, RoutineExerciseSet } from "../types/routine";

import { supabase } from "./supabase";

export async function getRoutines(): Promise<Routine[]> {
    const { data, error } = await supabase
        .from("routines")
        .select("id, name")
        .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
}

export async function createRoutine(params: { userId: string; name: string }): Promise<string> {
    const name = params.name.trim();

    if (!params.userId.trim()) {
        throw new Error("User ID is required.");
    }

    if (!name) {
        throw new Error("Routine name is required.");
    }

    const routineId = Crypto.randomUUID();
    const operationId = Crypto.randomUUID();

    const snapshot: RoutineEditorSnapshot = {
        routineId,
        name,
        exercises: [],
        setsByExerciseId: {},
    };

    await saveLocalRoutine({
        userId: params.userId,
        snapshot,
        syncOperationId: operationId,
        createdLocally: true,
    });

    return routineId;
}

/** Rename a routine locally and enqueue its complete current snapshot. */
export async function updateRoutine(params: {
    userId: string;
    routineId: string;
    name: string;
}): Promise<void> {
    const { userId, routineId } = params;
    const name = params.name.trim();
    if (!userId.trim() || !routineId.trim() || !name) {
        throw new Error("User ID, routine ID and routine name are required.");
    }

    const snapshot = await getLocalRoutine({ userId, routineId });
    if (!snapshot) {
        throw new Error("Local routine not found; hydrate it before editing.");
    }

    await saveLocalRoutine({
        userId,
        snapshot: { ...snapshot, name },
        syncOperationId: Crypto.randomUUID(),
    });
}

/** Soft-delete locally and enqueue a remote tombstone operation. */
export async function deleteRoutineById(params: {
    userId: string;
    routineId: string;
}): Promise<void> {
    const { userId, routineId } = params;
    if (!userId.trim() || !routineId.trim()) {
        throw new Error("User ID and routine ID are required.");
    }

    await deleteLocalRoutine({
        userId,
        routineId,
        syncOperationId: Crypto.randomUUID(),
    });
}

export async function getRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
    const { data, error } = await supabase
        .from("routine_exercises")
        .select(
            `
        id,
        routine_id,
        exercise_id,
        rest_seconds,
        exercise_rest_seconds,
        position,
        exercise:exercises (
            name,
            image_url
        )
        `
        )
        .eq("routine_id", routineId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return (data ?? []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
    })) as RoutineExercise[];
}

export async function addExerciseToRoutine(params: {
    routineId: string;
    exerciseId: string;
    restSeconds: number;
    exerciseRestSeconds: number;
    position: number;
}) {
    const { data, error } = await supabase
        .from("routine_exercises")
        .insert({
            routine_id: params.routineId,
            exercise_id: params.exerciseId,
            rest_seconds: params.restSeconds,
            exercise_rest_seconds: params.exerciseRestSeconds,
            position: params.position,
        })
        .select("id")
        .single();

    if (error) throw error;

    return data;
}

export async function updateRoutineExerciseConfig(params: {
    routineExerciseId: string;
    restSeconds: number;
    exerciseRestSeconds: number;
}) {
    const { error } = await supabase
        .from("routine_exercises")
        .update({
            rest_seconds: params.restSeconds,
            exercise_rest_seconds: params.exerciseRestSeconds,
        })
        .eq("id", params.routineExerciseId);

    if (error) throw error;
}

export async function updateRoutineExercisePosition(params: {
    routineExerciseId: string;
    position: number;
}) {
    const { error } = await supabase
        .from("routine_exercises")
        .update({
            position: params.position,
        })
        .eq("id", params.routineExerciseId);

    if (error) throw error;
}

export async function deleteRoutineExercise(routineExerciseId: string) {
    const { error } = await supabase.from("routine_exercises").delete().eq("id", routineExerciseId);

    if (error) throw error;
}

export async function createRoutineExerciseSet(params: {
    routineExerciseId: string;
    reps: number;
    weight: number;
}) {
    const { data, error } = await supabase
        .from("routine_exercise_sets")
        .insert({
            routine_exercise_id: params.routineExerciseId,
            reps: params.reps,
            weight: params.weight,
            is_pr: false,
        })
        .select(
            `
            id, 
            routine_exercise_id, 
            reps, 
            weight, 
            is_pr,
            created_at
            `
        )
        .single();

    if (error) throw error;

    return data as RoutineExerciseSet;
}

export async function updateRoutineExerciseSet(params: {
    setId: string;
    field: "weight" | "reps" | "is_pr";
    value: number | boolean;
}) {
    const { error } = await supabase
        .from("routine_exercise_sets")
        .update({
            [params.field]: params.value,
        })
        .eq("id", params.setId);

    if (error) throw error;
}

export async function deleteRoutineExerciseSet(setId: string) {
    const { error } = await supabase.from("routine_exercise_sets").delete().eq("id", setId);

    if (error) throw error;
}

export async function createRoutineExerciseSets(
    sets: {
        routine_exercise_id: string;
        reps: number;
        weight: number;
    }[]
) {
    if (!sets.length) return;

    const { error } = await supabase.from("routine_exercise_sets").insert(sets);

    if (error) throw error;
}

export async function getRoutineExerciseSetsByRoutineId(
    routineId: string
): Promise<Record<string, RoutineExerciseSet[]>> {
    const { data, error } = await supabase
        .from("routine_exercise_sets")
        .select(
            `
        id,
        routine_exercise_id,
        reps,
        weight,
        is_pr,
        created_at,
        routine_exercises!inner (
            routine_id
        )
        `
        )
        .eq("routine_exercises.routine_id", routineId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).reduce(
        (acc, set) => {
            const routineExerciseId = set.routine_exercise_id;

            if (!acc[routineExerciseId]) {
                acc[routineExerciseId] = [];
            }

            acc[routineExerciseId].push(set as RoutineExerciseSet);

            return acc;
        },
        {} as Record<string, RoutineExerciseSet[]>
    );
}
