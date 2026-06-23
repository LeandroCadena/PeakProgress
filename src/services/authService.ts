import { supabase } from "./supabase";

export async function updateUserPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;
}

export async function updateUserEmail(newEmail: string) {
    const { error } = await supabase.auth.updateUser({
        email: newEmail,
    });

    if (error) throw error;
}
