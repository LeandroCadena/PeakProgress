import { supabase } from "./supabase";

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("full_name, goal, experience_level, height_cm, weight_kg")
        .eq("id", userId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

export async function upsertProfile(params: {
    userId: string;
    fullName: string;
    goal: string;
    experienceLevel: string;
    heightCm: string;
    weightKg: string;
}) {
    const { error } = await supabase.from("profiles").upsert({
        id: params.userId,
        full_name: params.fullName.trim() || null,
        goal: params.goal.trim() || null,
        experience_level: params.experienceLevel.trim() || null,
        height_cm: params.heightCm ? Number(params.heightCm) : null,
        weight_kg: params.weightKg ? Number(params.weightKg) : null,
    });

    if (error) throw error;
}

export async function getWeightLogs() {
    const { data, error } = await supabase
        .from("weight_logs")
        .select("id, weight_kg, logged_at")
        .order("logged_at", { ascending: false })
        .limit(10);

    if (error) throw error;

    return data ?? [];
}

export async function createWeightLog(params: { userId: string; weightKg: number }) {
    const { error } = await supabase.from("weight_logs").insert({
        user_id: params.userId,
        weight_kg: params.weightKg,
    });

    if (error) throw error;
}

export async function removeWeightLog(id: string) {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);

    if (error) throw error;
}
