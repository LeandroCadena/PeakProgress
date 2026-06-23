import { supabase } from "./supabase";

export type UserSettings = {
    user_id: string;
    theme: "dark" | "light";
    language: "en" | "es";
    use_global_timers: boolean;
    global_set_rest_seconds: number;
    global_exercise_rest_seconds: number;
    sounds_enabled: boolean;
    notifications_enabled: boolean;
    updated_at: string;
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
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
