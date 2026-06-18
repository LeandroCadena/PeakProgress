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

export async function getExerciseProgress(): Promise<ExerciseProgress[]> {
    const { data, error } = await supabase
        .from("workout_sets")
        .select(`
      id,
      exercise_id,
      exercise_name_snapshot,
      weight,
      reps,
      exercise:exercises (
        id,
        name
      )
    `);

    if (error) throw error;

    const sets = (data ?? []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
    })) as WorkoutSetProgress[];

    const progressByExercise: Record<string, ExerciseProgress> = {};

    sets.forEach((set) => {
        const exerciseId = set.exercise_id ?? set.exercise?.id ?? set.id;

        const exerciseName =
            set.exercise_name_snapshot ??
            set.exercise?.name ??
            "Unknown Exercise";

        const weight = Number(set.weight ?? 0);
        const reps = Number(set.reps ?? 0);
        const volume = weight * reps;

        if (!progressByExercise[exerciseId]) {
            progressByExercise[exerciseId] = {
                exerciseId,
                exerciseName,
                bestWeight: weight,
                bestReps: reps,
                totalVolume: volume,
                totalSets: 1,
            };
            return;
        }

        const current = progressByExercise[exerciseId];

        current.totalVolume += volume;
        current.totalSets += 1;

        if (weight > current.bestWeight) {
            current.bestWeight = weight;
            current.bestReps = reps;
        }
    });

    return Object.values(progressByExercise);
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