import { supabase } from "./supabase";
import { Routine, RoutineExerciseSet } from "../types/routine";

export async function getRoutines(): Promise<Routine[]> {
    const { data, error } = await supabase
        .from("routines")
        .select("id, name, description")
        .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
}

export async function createRoutine(params: {
    userId: string;
    name: string;
    description: string;
}) {
    const { error } = await supabase.from("routines").insert({
        user_id: params.userId,
        name: params.name.trim(),
        description: params.description.trim() || null,
    });

    if (error) throw error;
}

export async function updateRoutine(params: {
    routineId: string;
    name: string;
    description: string;
}) {
    const { error } = await supabase
        .from("routines")
        .update({
            name: params.name.trim(),
            description: params.description.trim() || null,
        })
        .eq("id", params.routineId);

    if (error) throw error;
}

export async function deleteRoutineById(routineId: string) {
    const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", routineId);

    if (error) throw error;
}

export async function createRoutineExerciseSet(params: {
    routineExerciseId: string;
    reps: number;
    weight: number;
}) {
    const { error } = await supabase
        .from("routine_exercise_sets")
        .insert({
            routine_exercise_id: params.routineExerciseId,
            reps: params.reps,
            weight: params.weight,
        });

    if (error) throw error;
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
    const { error } = await supabase
        .from("routine_exercise_sets")
        .delete()
        .eq("id", setId);

    if (error) throw error;
}

export async function getRoutineExerciseSetsByRoutineId(
    routineId: string
): Promise<Record<string, RoutineExerciseSet[]>> {
    const { data, error } = await supabase
        .from("routine_exercise_sets")
        .select(`
        id,
        routine_exercise_id,
        reps,
        weight,
        is_pr,
        created_at,
        routine_exercises!inner (
            routine_id
        )
        `)
        .eq("routine_exercises.routine_id", routineId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).reduce((acc, set) => {
        const routineExerciseId = set.routine_exercise_id;

        if (!acc[routineExerciseId]) {
            acc[routineExerciseId] = [];
        }

        acc[routineExerciseId].push(set as RoutineExerciseSet);

        return acc;
    }, {} as Record<string, RoutineExerciseSet[]>);
}