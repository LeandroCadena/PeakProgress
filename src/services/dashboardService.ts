import { GUEST_USER_ID } from "../database/guestAccount";
import {
    getLocalWorkoutHistory,
    readLocalWorkoutSnapshot,
} from "../database/repositories/localWorkoutRepository";
import { getLocalRoutines } from "../database/repositories/routineRepository";
import { DashboardStats } from "../types/dashboard";

import { getLocalWorkoutStreak, getWorkoutStreak, getWorkoutStreakStatus } from "./streakService";
import { supabase } from "./supabase";

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    const local = await getLocalWorkoutHistory(userId);
    if (userId === GUEST_USER_ID) {
        const streak = getLocalWorkoutStreak(userId, local);
        const status = getWorkoutStreakStatus(streak);
        return {
            routinesCount: (await getLocalRoutines(userId)).length,
            completedWorkouts: local.length,
            lastWorkoutName: local[0]?.routine_name_snapshot ?? null,
            streakWeeks: streak?.streak_weeks ?? 0,
            streakWorkouts: streak?.total_workouts ?? 0,
            streakStatus: status.status,
            streakDaysRemaining: status.daysRemaining,
        };
    }

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

    const streak = (await getWorkoutStreak(userId)) ?? getLocalWorkoutStreak(userId, local);
    const streakStatus = getWorkoutStreakStatus(streak);

    return {
        routinesCount: routinesCount ?? 0,
        completedWorkouts: (completedWorkouts ?? 0) + local.length,
        lastWorkoutName:
            local[0] && (!lastWorkout || local[0].started_at > lastWorkout.started_at)
                ? local[0].routine_name_snapshot
                : lastWorkoutName,
        streakWeeks: streak?.streak_weeks ?? 0,
        streakWorkouts: streak?.total_workouts ?? 0,
        streakStatus: streakStatus.status,
        streakDaysRemaining: streakStatus.daysRemaining,
    };
}

export async function getRecentWorkouts(userId: string) {
    const local = (await getLocalWorkoutHistory(userId)).slice(0, 5).map((row) => ({
        id: row.id,
        routine_name_snapshot: row.routine_name_snapshot,
        started_at: row.started_at,
        completed_at: row.completed_at!,
        workout_session_exercises: readLocalWorkoutSnapshot(row).sessionExercises.map(({ id }) => ({
            id,
        })),
    }));
    if (userId === GUEST_USER_ID) return local;

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

    return [...(data ?? []), ...local]
        .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
        .slice(0, 5);
}
