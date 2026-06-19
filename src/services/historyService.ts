import { supabase } from "./supabase";

export async function getCompletedWorkoutSessions() {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select(`
      id,
      started_at,
      completed_at,
      routine_name_snapshot,
      total_sets,
      total_volume,
      duration_minutes,
      routines (
        name
      )
    `)
        .not("completed_at", "is", null)
        .order("started_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
}

export async function getWorkoutSets(sessionId: string) {
    const { data, error } = await supabase
        .from("workout_sets")
        .select(`
      id,
      exercise_name_snapshot,
      set_number,
      reps,
      weight,
      is_completed
    `)
        .eq("workout_session_id", sessionId)
        .order("exercise_name_snapshot", { ascending: true })
        .order("set_number", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function getWorkoutSummary(sessionId: string) {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select("duration_minutes, total_sets, total_volume")
        .eq("id", sessionId)
        .single();

    if (error) throw error;

    return {
        durationMinutes: data.duration_minutes ?? 0,
        totalSets: data.total_sets ?? 0,
        totalVolume: data.total_volume ?? 0,
    };
}