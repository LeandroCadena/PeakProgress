import { supabase } from "./supabase";
import { ExerciseProgress } from "../types/progress";

export type WorkoutSetProgress = {
    id: string;
    exercise_id: string | null;
    exercise_name_snapshot: string | null;
    weight: number | null;
    reps: number;
    exercise: {
        id: string;
        name: string;
    } | null;
};

export async function getExerciseProgress(userId: string): Promise<ExerciseProgress[]> {
    const { data, error } = await supabase
        .from("user_exercise_records")
        .select(`
      exercise_id,
      best_volume,
      best_weight,
      best_reps,
      exercises (
        name
      )
    `)
        .eq("user_id", userId)
        .order("best_volume", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((item: any) => {
        const exercise = Array.isArray(item.exercises)
            ? item.exercises[0]
            : item.exercises;

        return {
            exerciseId: item.exercise_id,
            exerciseName: exercise?.name ?? "Exercise",
            bestVolume: Number(item.best_volume ?? 0),
            bestWeight: Number(item.best_weight ?? 0),
            bestReps: Number(item.best_reps ?? 0),
        };
    });
}

export async function getExerciseProgressPoints(exerciseId: string) {
    const { data, error } = await supabase
        .from("workout_sets")
        .select("weight, reps, created_at")
        .eq("exercise_id", exerciseId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function getBestExerciseVolume(params: {
    exerciseId: string;
    userId: string;
}) {
    const { data, error } = await supabase
        .from("workout_sets")
        .select(`
      weight,
      reps,
      workout_sessions!inner (
        user_id,
        completed_at,
        discarded_at
      )
    `)
        .eq("exercise_id", params.exerciseId)
        .eq("workout_sessions.user_id", params.userId)
        .not("workout_sessions.completed_at", "is", null)
        .is("workout_sessions.discarded_at", null);

    if (error) throw error;

    return (data ?? []).reduce((best, set) => {
        const volume = Number(set.weight ?? 0) * Number(set.reps ?? 0);
        return Math.max(best, volume);
    }, 0);
}

export async function getUserExerciseRecord(params: {
    userId: string;
    exerciseId: string;
}) {
    const { data, error } = await supabase
        .from("user_exercise_records")
        .select(`
        id,
        user_id,
        exercise_id,
        best_volume,
        best_weight,
        best_reps,
        best_set_id
        `)
        .eq("user_id", params.userId)
        .eq("exercise_id", params.exerciseId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

export async function getUserExerciseBestVolume(params: {
    userId: string;
    exerciseId: string;
}) {
    const record = await getUserExerciseRecord(params);

    return Number(record?.best_volume ?? 0);
}

export async function upsertUserExerciseRecord(params: {
    userId: string;
    exerciseId: string;
    bestVolume: number;
    bestWeight: number;
    bestReps: number;
    bestSetId: string;
}) {
    const { error } = await supabase
        .from("user_exercise_records")
        .upsert(
            {
                user_id: params.userId,
                exercise_id: params.exerciseId,
                best_volume: params.bestVolume,
                best_weight: params.bestWeight,
                best_reps: params.bestReps,
                best_set_id: params.bestSetId,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,exercise_id",
            }
        );

    if (error) throw error;
}