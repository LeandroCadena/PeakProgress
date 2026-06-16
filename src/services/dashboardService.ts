import { supabase } from "./supabase";

export type DashboardStats = {
    routinesCount: number;
    completedWorkouts: number;
    totalSets: number;
    lastWorkoutName: string | null;
    currentStreak: number;
    nextWorkoutName: string | null;
};

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

export async function getDashboardStats(): Promise<DashboardStats> {
    const { count: routinesCount, error: routinesError } = await supabase
        .from("routines")
        .select("*", { count: "exact", head: true });

    if (routinesError) throw routinesError;

    const { count: completedWorkouts, error: workoutsError } = await supabase
        .from("workout_sessions")
        .select("*", { count: "exact", head: true })
        .not("completed_at", "is", null);

    if (workoutsError) throw workoutsError;

    const { count: totalSets, error: setsError } = await supabase
        .from("workout_sets")
        .select("*", { count: "exact", head: true });

    if (setsError) throw setsError;

    const { data: lastWorkout, error: lastWorkoutError } = await supabase
        .from("workout_sessions")
        .select(`
      id,
      started_at,
      routines (
        name
      )
    `)
        .not("completed_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastWorkoutError) throw lastWorkoutError;

    const { data: completedSessions, error: streakError } = await supabase
        .from("workout_sessions")
        .select("completed_at")
        .not("completed_at", "is", null);

    if (streakError) throw streakError;

    const { data: routinesData, error: routinesListError } = await supabase
        .from("routines")
        .select("id, name")
        .order("created_at", { ascending: false });

    if (routinesListError) throw routinesListError;

    const lastWorkoutName = (lastWorkout?.routines as any)?.[0]?.name ?? null;

    const nextWorkout =
        routinesData?.find((routine) => routine.name !== lastWorkoutName) ??
        routinesData?.[0] ??
        null;

    return {
        routinesCount: routinesCount ?? 0,
        completedWorkouts: completedWorkouts ?? 0,
        totalSets: totalSets ?? 0,
        lastWorkoutName,
        currentStreak: calculateWorkoutStreak(
            completedSessions?.map((session) => session.completed_at) ?? []
        ),
        nextWorkoutName: nextWorkout?.name ?? null,
    };
}