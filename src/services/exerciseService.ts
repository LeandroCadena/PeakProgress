import { supabase } from "./supabase";
import { Exercise, Muscle } from "../types/exercise";

export async function getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
        .from("exercises")
        .select("id, name, equipment, difficulty")
        .order("name", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function getMuscles(): Promise<Muscle[]> {
    const { data, error } = await supabase
        .from("muscles")
        .select("id, name")
        .order("name");

    if (error) throw error;

    return data ?? [];
}

export async function getExercisesByMuscle(
    selectedMuscleId: string | null
): Promise<Exercise[]> {
    const { data, error } = await supabase
        .from("exercises")
        .select(`
      id,
      name,
      equipment,
      difficulty,
      exercise_muscles (
        muscle_id
      )
    `)
        .order("name");

    if (error) throw error;

    if (!selectedMuscleId) {
        return data ?? [];
    }

    return (data ?? []).filter((exercise: any) =>
        exercise.exercise_muscles?.some(
            (relation: any) => relation.muscle_id === selectedMuscleId
        )
    );
}

export async function getExerciseDetail(exerciseId: string) {
    const { data, error } = await supabase
        .from("exercises")
        .select(`
      id,
      name,
      description,
      instructions,
      equipment,
      difficulty,
      exercise_muscles (
        role,
        muscles (
          name
        )
      )
    `)
        .eq("id", exerciseId)
        .single();

    if (error) throw error;

    return data;
}