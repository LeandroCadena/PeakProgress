import { GUEST_USER_ID } from "../database/guestAccount";
import {
    getLocalPreference,
    updateLocalPreference,
} from "../database/repositories/localPreferencesRepository";

import { supabase } from "./supabase";

export type UserSettings = {
    sounds_enabled: boolean;
    notifications_enabled: boolean;
    update_routine_after_workout: boolean;
    use_global_timers: boolean;
    global_set_rest_seconds: number;
    global_exercise_rest_seconds: number;
    theme: "dark" | "light";
    language: "en" | "es";
};

const defaults: UserSettings = {
    sounds_enabled: true,
    notifications_enabled: true,
    update_routine_after_workout: true,
    use_global_timers: false,
    global_set_rest_seconds: 90,
    global_exercise_rest_seconds: 120,
    theme: "dark",
    language: "en",
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
    const local = await getLocalPreference<UserSettings>(userId, "settings");
    if (local || userId === GUEST_USER_ID) return local ?? defaults;

    const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;

    if (data) return data as UserSettings;

    const { data: created, error: createError } = await supabase
        .from("user_settings")
        .insert({
            user_id: userId,
        })
        .select("*")
        .single();

    if (createError) throw createError;

    return created as UserSettings;
}

export async function updateUserSettings(params: {
    userId: string;
    updates: Partial<Omit<UserSettings, "user_id" | "updated_at">>;
}) {
    if (params.userId === GUEST_USER_ID || (await getLocalPreference(params.userId, "settings"))) {
        return updateLocalPreference<UserSettings>(params.userId, "settings", (current) => ({
            ...(current ?? defaults),
            ...params.updates,
        }));
    }

    const { data, error } = await supabase
        .from("user_settings")
        .update({
            ...params.updates,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", params.userId)
        .select("*")
        .single();

    if (error) throw error;

    return data as UserSettings;
}
