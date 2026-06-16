import { supabase } from "./supabase";
import { Routine } from "../types/routine";

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