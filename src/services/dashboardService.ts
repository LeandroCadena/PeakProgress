import { DashboardStats } from "../types/dashboard";

import { getWorkoutStreak, getWorkoutStreakStatus } from "./streakService";
import { supabase } from "./supabase";

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    const { count: routinesCount, error: routinesError } = await supabase
        .from("routines")
        .select("*", { count: "exact", head: true });

    if (routinesError) throw routinesError;

    const { count: completedWorkouts, error: workoutsError } = await supabase
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .not("completed_at", "is", null)
        .is("discarded_at", null);

    if (workoutsError) throw workoutsError;

    const { data: lastWorkout, error: lastWorkoutError } = await supabase
        .from("workout_sessions")
        .select(
            `
        id,
        started_at,
        routine_name_snapshot
        `
        )
        .not("completed_at", "is", null)
        .is("discarded_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastWorkoutError) throw lastWorkoutError;

    const lastWorkoutName = lastWorkout?.routine_name_snapshot ?? null;

    const streak = await getWorkoutStreak(userId);
    const streakStatus = getWorkoutStreakStatus(streak);

    return {
        routinesCount: routinesCount ?? 0,
        completedWorkouts: completedWorkouts ?? 0,
        lastWorkoutName,
        streakWeeks: streak?.streak_weeks ?? 0,
        streakWorkouts: streak?.total_workouts ?? 0,
        streakStatus: streakStatus.status,
        streakDaysRemaining: streakStatus.daysRemaining,
    };
}

export async function getRecentWorkouts(userId: string) {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select(
            `
            id,
            routine_name_snapshot,
            started_at,
            completed_at,
            workout_session_exercises (
                id
            )
        `
        )
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(5);

    if (error) throw error;

    return data ?? [];
}
