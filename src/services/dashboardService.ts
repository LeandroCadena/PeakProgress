import { supabase } from "./supabase";
import { DashboardStats } from "../types/dashboard";
import { getWorkoutStreak, getWorkoutStreakStatus } from "./streakService";

function calculateWorkoutStreak(dates: string[]) {
    if (!dates.length) return 0;

    const uniqueDays = Array.from(
        new Set(dates.map((date) => new Date(date).toISOString().split("T")[0]))
    ).sort((a, b) => (a > b ? -1 : 1));

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < uniqueDays.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        const expectedDay = expectedDate.toISOString().split("T")[0];

        if (uniqueDays.includes(expectedDay)) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

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
        .select(`
        id,
        started_at,
        routine_name_snapshot
        `)
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
        .select(`
            id,
            routine_name_snapshot,
            started_at,
            completed_at,
            workout_session_exercises (
                id
            )
        `)
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(2);

    if (error) throw error;

    return data ?? [];
}