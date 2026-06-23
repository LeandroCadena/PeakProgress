import { Exercise, Muscle , FilterMode, MuscleRegion } from "../types/exercise";

import { supabase } from "./supabase";

export async function getExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
        .from("exercises")
        .select("id, name, equipment, difficulty")
        .order("name", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function getMuscles(): Promise<Muscle[]> {
    const { data, error } = await supabase.from("muscles").select("id, name").order("name");

    if (error) throw error;

    return data ?? [];
}

export async function getExercisesByFilter(params: {
    filterMode: FilterMode;
    selectedIds: string[];
}): Promise<Exercise[]> {
    const { data, error } = await supabase
        .from("exercises")
        .select(
            `
        id,
        name,
        equipment,
        difficulty,
        image_url,
        exercise_muscles (
            muscle_id,
            muscles (
            region_id
            )
        )
        `
        )
        .order("name");

    if (error) throw error;

    if (!params.selectedIds.length) return data ?? [];

    return (data ?? []).filter((exercise: any) => {
        const relations = exercise.exercise_muscles ?? [];

        if (params.filterMode === "muscle") {
            return relations.some((relation: any) =>
                params.selectedIds.includes(relation.muscle_id)
            );
        }

        return relations.some(
            (relation: any) =>
                relation.muscles?.region_id &&
                params.selectedIds.includes(relation.muscles.region_id)
        );
    });
}

export async function getExerciseDetail(exerciseId: string) {
    const { data, error } = await supabase
        .from("exercises")
        .select(
            `
        id,
        name,
        description,
        instructions,
        tips,
        equipment,
        difficulty,
        image_url,
        animation_url,
        exercise_muscles (
            role,
            muscles (
            name
            )
        )
        `
        )
        .eq("id", exerciseId)
        .single();

    if (error) throw error;

    return data;
}

export async function getMuscleRegions(): Promise<MuscleRegion[]> {
    const { data, error } = await supabase.from("muscle_regions").select("id, name").order("name");

    if (error) throw error;

    return data ?? [];
}
