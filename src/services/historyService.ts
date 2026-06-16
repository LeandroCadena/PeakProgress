import { supabase } from "./supabase";

export async function getCompletedWorkoutSessions() {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select(`
      id,
      started_at,
      completed_at,
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
      set_number,
      reps,
      weight,
      exercises (
        name
      )
    `)
        .eq("workout_session_id", sessionId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function getWorkoutSummary(sessionId: string) {
    const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("started_at, completed_at")
        .eq("id", sessionId)
        .single();

    if (sessionError) throw sessionError;

    const { data: sets, error: setsError } = await supabase
        .from("workout_sets")
        .select("reps, weight")
        .eq("workout_session_id", sessionId);

    if (setsError) throw setsError;

    const totalSets = sets?.length ?? 0;

    const totalVolume =
        sets?.reduce((sum, set) => {
            return sum + Number(set.weight ?? 0) * Number(set.reps ?? 0);
        }, 0) ?? 0;

    const start = new Date(session.started_at).getTime();
    const end = new Date(session.completed_at ?? new Date()).getTime();

    return {
        durationMinutes: Math.max(1, Math.round((end - start) / 60000)),
        totalSets,
        totalVolume,
    };
}