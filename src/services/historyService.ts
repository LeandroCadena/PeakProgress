import { GUEST_USER_ID } from "../database/guestAccount";
import {
    getLocalWorkout,
    getLocalWorkoutHistory,
    readLocalWorkoutSnapshot,
} from "../database/repositories/localWorkoutRepository";

import { supabase } from "./supabase";

export async function getCompletedWorkoutSessions(userId: string) {
    const local = await getLocalWorkoutHistory(userId);
    if (userId === GUEST_USER_ID) return local;

    const { data, error } = await supabase
        .from("workout_sessions")
        .select(
            `
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
        `
        )
        .not("completed_at", "is", null)
        .is("discarded_at", null)
        .order("started_at", { ascending: false });

    if (error) throw error;

    return [...local, ...(data ?? [])].sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export async function getWorkoutSets(sessionId: string, userId: string) {
    const local = await getLocalWorkout(sessionId, userId);
    if (local) {
        const { sessionExercises, savedSets } = readLocalWorkoutSnapshot(local);
        return sessionExercises.flatMap((exercise) =>
            (savedSets[exercise.id] ?? []).map((set) => ({
                ...set,
                exercise_name_snapshot: exercise.exercise_name_snapshot,
            }))
        );
    }
    if (userId === GUEST_USER_ID) return [];

    const { data, error } = await supabase
        .from("workout_sets")
        .select(
            `
        id,
        exercise_name_snapshot,
        exercise_id,
        reps,
        weight,
        is_completed
        `
        )
        .eq("workout_session_id", sessionId)
        .order("exercise_name_snapshot", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function getWorkoutSummary(sessionId: string, userId: string) {
    const local = await getLocalWorkout(sessionId, userId);
    if (local) {
        return {
            durationMinutes: local.duration_minutes,
            totalSets: local.total_sets,
            totalVolume: local.total_volume,
        };
    }
    if (userId === GUEST_USER_ID) throw new Error("Workout not found on this device.");

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
