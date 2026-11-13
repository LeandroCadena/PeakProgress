import { randomUUID } from "expo-crypto";

import { GUEST_USER_ID } from "../database/guestAccount";
import {
    getLocalPreference,
    updateLocalPreference,
} from "../database/repositories/localPreferencesRepository";
import type { WeightLog } from "../types/profile";

import { supabase } from "./supabase";

type LocalProfile = {
    full_name: string | null;
    goal: string | null;
    experience_level: string | null;
    height_cm: number | null;
    weight_kg: number | null;
};

export async function getProfile(userId: string) {
    const local = await getLocalPreference<LocalProfile>(userId, "profile");
    if (local || userId === GUEST_USER_ID) return local;

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
    const profile = {
        full_name: params.fullName.trim() || null,
        goal: params.goal.trim() || null,
        experience_level: params.experienceLevel.trim() || null,
        height_cm: params.heightCm ? Number(params.heightCm) : null,
        weight_kg: params.weightKg ? Number(params.weightKg) : null,
    };
    if (params.userId === GUEST_USER_ID || (await getLocalPreference(params.userId, "profile"))) {
        await updateLocalPreference(params.userId, "profile", () => profile);
        return;
    }

    const { error } = await supabase.from("profiles").upsert({ id: params.userId, ...profile });

    if (error) throw error;
}

export async function getWeightLogs(userId: string) {
    const local = (await getLocalPreference<WeightLog[]>(userId, "weight")) ?? [];
    if (userId === GUEST_USER_ID) return local.slice(0, 10);

    const { data, error } = await supabase
        .from("weight_logs")
        .select("id, weight_kg, logged_at")
        .order("logged_at", { ascending: false })
        .limit(10);

    if (error) throw error;

    return [...(data ?? []), ...local]
        .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
        .slice(0, 10);
}

export async function createWeightLog(params: { userId: string; weightKg: number }) {
    if (params.userId === GUEST_USER_ID) {
        await updateLocalPreference<WeightLog[]>(params.userId, "weight", (current) => [
            { id: randomUUID(), weight_kg: params.weightKg, logged_at: new Date().toISOString() },
            ...(current ?? []),
        ]);
        return;
    }

    const { error } = await supabase.from("weight_logs").insert({
        user_id: params.userId,
        weight_kg: params.weightKg,
    });

    if (error) throw error;
}

export async function removeWeightLog(id: string, userId: string) {
    const local = await getLocalPreference<WeightLog[]>(userId, "weight");
    if (userId === GUEST_USER_ID || local?.some((log) => log.id === id)) {
        await updateLocalPreference<WeightLog[]>(userId, "weight", (current) =>
            (current ?? []).filter((log) => log.id !== id)
        );
        return;
    }

    const { error } = await supabase.from("weight_logs").delete().eq("id", id);

    if (error) throw error;
}
