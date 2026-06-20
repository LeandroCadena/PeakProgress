import { supabase } from "./supabase";

export type WorkoutStreak = {
    user_id: string;
    streak_weeks: number;
    total_workouts: number;
    last_trained_week_end: string | null;
    updated_at: string;
};

export async function getWorkoutStreak(userId: string) {
    const { data, error } = await supabase
        .from("user_workout_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;

    return data as WorkoutStreak | null;
}

function getWeekEndDate(date = new Date()) {
    const weekEnd = new Date(date);
    const day = weekEnd.getDay(); // 0 domingo, 1 lunes...
    const daysUntilSunday = day === 0 ? 0 : 7 - day;

    weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
    weekEnd.setHours(0, 0, 0, 0);

    return weekEnd;
}

function toDateString(date: Date) {
    return date.toISOString().split("T")[0];
}

function getPreviousWeekEndDate(weekEnd: Date) {
    const previous = new Date(weekEnd);
    previous.setDate(previous.getDate() - 7);
    return previous;
}

export async function updateWorkoutStreakAfterFinish(userId: string) {
    const currentWeekEnd = getWeekEndDate();
    const currentWeekEndString = toDateString(currentWeekEnd);
    const previousWeekEndString = toDateString(
        getPreviousWeekEndDate(currentWeekEnd)
    );

    const currentStreak = await getWorkoutStreak(userId);

    if (!currentStreak) {
        const { error } = await supabase.from("user_workout_streaks").insert({
            user_id: userId,
            streak_weeks: 1,
            total_workouts: 1,
            last_trained_week_end: currentWeekEndString,
            updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        return;
    }

    const lastWeekEnd = currentStreak.last_trained_week_end;

    let nextStreakWeeks = 1;
    let nextTotalWorkouts = 1;

    if (lastWeekEnd === currentWeekEndString) {
        nextStreakWeeks = currentStreak.streak_weeks;
        nextTotalWorkouts = currentStreak.total_workouts + 1;
    } else if (lastWeekEnd === previousWeekEndString) {
        nextStreakWeeks = currentStreak.streak_weeks + 1;
        nextTotalWorkouts = currentStreak.total_workouts + 1;
    }

    const { error } = await supabase
        .from("user_workout_streaks")
        .update({
            streak_weeks: nextStreakWeeks,
            total_workouts: nextTotalWorkouts,
            last_trained_week_end: currentWeekEndString,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    if (error) throw error;
}

export function getWorkoutStreakStatus(streak: WorkoutStreak | null) {
    if (!streak || !streak.last_trained_week_end) {
        return {
            status: "empty" as const,
            daysRemaining: null,
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastTrainedWeekEnd = getWeekEndDate(new Date(streak.last_trained_week_end));
    lastTrainedWeekEnd.setHours(0, 0, 0, 0);

    const currentWeekEnd = getWeekEndDate(today);
    const previousWeekEnd = getPreviousWeekEndDate(currentWeekEnd);

    console.log(lastTrainedWeekEnd)
    console.log(currentWeekEnd)
    console.log(previousWeekEnd)

    const isActive =
        toDateString(lastTrainedWeekEnd) === toDateString(currentWeekEnd) ||
        toDateString(lastTrainedWeekEnd) === toDateString(previousWeekEnd);

    if (!isActive) {
        return {
            status: "expired" as const,
            daysRemaining: 0,
        };
    }

    const diffMs = currentWeekEnd.getTime() - today.getTime();
    const daysRemaining = Math.max(
        0,
        Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    );

    if (
        toDateString(lastTrainedWeekEnd) === toDateString(previousWeekEnd) &&
        daysRemaining <= 1
    ) {
        return {
            status: "warning" as const,
            daysRemaining,
        };
    }

    return {
        status: "active" as const,
        daysRemaining,
    };
}