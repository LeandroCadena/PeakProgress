import { RoutineExerciseSet } from "../types/routine";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";

import { getUserSettings } from "./settingsService";
import { supabase } from "./supabase";

export async function getActiveWorkoutSession(userId: string) {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select(
            `
        id,
        routine_id,
        started_at,
        routines (
            name
        )
        `
        )
        .eq("user_id", userId)
        .is("completed_at", null)
        .is("discarded_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    return data;
}

export async function createWorkoutSession(params: { userId: string; routineId: string }) {
    const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
            user_id: params.userId,
            routine_id: params.routineId,
            started_at: new Date().toISOString(),
        })
        .select("id, routine_id, started_at")
        .single();

    if (error) throw error;

    return data;
}

export async function discardWorkoutSession(sessionId: string) {
    const { error } = await supabase
        .from("workout_sessions")
        .update({
            discarded_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

    if (error) throw error;
}

export async function getOrCreateWorkoutAfterDiscard(params: {
    userId: string;
    routineId: string;
    activeSessionId?: string;
}) {
    if (params.activeSessionId) {
        await discardWorkoutSession(params.activeSessionId);
    }

    return createWorkoutSession({
        userId: params.userId,
        routineId: params.routineId,
    });
}

export async function getSavedSets(
    sessionId: string
): Promise<Record<string, WorkoutSessionSet[]>> {
    const { data, error } = await supabase
        .from("workout_sets")
        .select(
            `
        id,
        workout_session_exercise_id,
        exercise_id,
        reps,
        weight,
        is_completed,
        is_pr,
        created_at
        `
        )
        .eq("workout_session_id", sessionId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    const grouped: Record<string, WorkoutSessionSet[]> = {};

    data?.forEach((set) => {
        const groupKey = set.workout_session_exercise_id ?? set.exercise_id;
        if (!groupKey) return;

        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(set as WorkoutSessionSet);
    });

    return grouped;
}

export async function finishWorkoutSession(params: {
    sessionId: string;
    routineName: string;
    totalSets: number;
    totalVolume: number;
}) {
    const completedAt = new Date().toISOString();

    const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("id", params.sessionId)
        .single();

    if (sessionError) {
        throw sessionError;
    }

    const startedAt = new Date(session.started_at).getTime();

    const finishedAt = new Date(completedAt).getTime();

    const durationMinutes = Math.max(1, Math.round((finishedAt - startedAt) / 60000));

    const { data, error } = await supabase
        .from("workout_sessions")
        .update({
            completed_at: completedAt,
            routine_name_snapshot: params.routineName,
            total_sets: params.totalSets,
            total_volume: params.totalVolume,
            duration_minutes: durationMinutes,
        })
        .eq("id", params.sessionId)
        .select("id, completed_at")
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function syncWorkoutSessionToRoutine(params: {
    routineId: string;
    sessionExercises: WorkoutSessionExercise[];
    savedSets: Record<string, WorkoutSessionSet[]>;
    editingValues: Record<string, string>;
}) {
    await supabase.from("routine_exercises").delete().eq("routine_id", params.routineId);

    const exercisesToInsert = params.sessionExercises
        .filter((sessionExercise) => sessionExercise.exercise_id)
        .map((sessionExercise, index) => ({
            routine_id: params.routineId,
            exercise_id: sessionExercise.exercise_id,
            position: index,
            rest_seconds: sessionExercise.rest_seconds ?? 90,
            exercise_rest_seconds: sessionExercise.exercise_rest_seconds ?? 120,
            session_exercise_id: sessionExercise.id,
        }));

    const { data: createdRoutineExercises, error: routineExercisesError } = await supabase
        .from("routine_exercises")
        .insert(exercisesToInsert.map(({ session_exercise_id, ...item }) => item))
        .select("id, exercise_id");

    if (routineExercisesError) throw routineExercisesError;

    const createdRoutineExercisesWithSessionIds =
        createdRoutineExercises?.map((routineExercise, index) => ({
            ...routineExercise,
            session_exercise_id: exercisesToInsert[index].session_exercise_id,
        })) ?? [];

    const routineExerciseIdBySessionExerciseId = new Map(
        createdRoutineExercisesWithSessionIds.map((item) => [item.session_exercise_id, item.id])
    );

    const setsToInsert = params.sessionExercises.flatMap((sessionExercise) => {
        const routineExerciseId = routineExerciseIdBySessionExerciseId.get(sessionExercise.id);

        if (!routineExerciseId) return [];

        const sets = params.savedSets[sessionExercise.id] ?? [];

        return sets.map((set) => ({
            routine_exercise_id: routineExerciseId,
            reps: Number(params.editingValues[`${set.id}-reps`] ?? set.reps ?? 0),
            weight: Number(params.editingValues[`${set.id}-weight`] ?? set.weight ?? 0),
        }));
    });

    if (setsToInsert.length > 0) {
        const { error: routineSetsError } = await supabase
            .from("routine_exercise_sets")
            .insert(setsToInsert);

        if (routineSetsError) throw routineSetsError;
    }
}

export async function getWorkoutSessionExercises(
    sessionId: string
): Promise<WorkoutSessionExercise[]> {
    const { data, error } = await supabase
        .from("workout_session_exercises")
        .select(
            `
        id,
        workout_session_id,
        exercise_id,
        exercise_name_snapshot,
        exercise_image_url_snapshot,
        exercise_rest_seconds,
        position,
        rest_seconds
        `
        )
        .eq("workout_session_id", sessionId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

async function getRoutineExercisesWithSets(routineId: string) {
    const { data, error } = await supabase
        .from("routine_exercises")
        .select(
            `
            id,
            exercise_id,
            position,
            rest_seconds,
            exercise_rest_seconds,
            exercise:exercises (
                name,
                image_url
            ),
            routine_exercise_sets (
                id,
                routine_exercise_id,
                reps,
                weight,
                is_pr,
                created_at
            )
        `
        )
        .eq("routine_id", routineId)
        .order("position", { ascending: true })
        .order("created_at", {
            ascending: true,
            referencedTable: "routine_exercise_sets",
        });

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
        routine_exercise_sets: item.routine_exercise_sets ?? [],
    }));
}

export async function createWorkoutSessionExercisesFromRoutine(params: {
    sessionId: string;
    routineId: string;
    userId: string;
}) {
    const settings = await getUserSettings(params.userId);
    const routineExercises = await getRoutineExercisesWithSets(params.routineId);

    const sessionExercisesToInsert = routineExercises.map((routineExercise) => ({
        workout_session_id: params.sessionId,
        exercise_id: routineExercise.exercise_id,
        exercise_name_snapshot: routineExercise.exercise?.name ?? "Exercise",
        position: routineExercise.position ?? 0,
        exercise_image_url_snapshot: routineExercise.exercise?.image_url ?? null,
        rest_seconds: settings.use_global_timers
            ? settings.global_set_rest_seconds
            : (routineExercise.rest_seconds ?? 90),
        exercise_rest_seconds: settings.use_global_timers
            ? settings.global_exercise_rest_seconds
            : (routineExercise.exercise_rest_seconds ?? 120),
    }));

    const { data: createdSessionExercises, error: sessionExercisesError } = await supabase
        .from("workout_session_exercises")
        .insert(sessionExercisesToInsert).select(`
            id,
            workout_session_id,
            exercise_id,
            exercise_name_snapshot,
            exercise_image_url_snapshot,
            exercise_rest_seconds,
            position,
            rest_seconds,
            created_at
        `);

    if (sessionExercisesError) throw sessionExercisesError;

    const sessionExerciseIdByExerciseId = new Map(
        (createdSessionExercises ?? []).map((item) => [item.exercise_id, item.id])
    );

    const workoutSetsToInsert = routineExercises.flatMap((routineExercise) => {
        const sessionExerciseId = sessionExerciseIdByExerciseId.get(routineExercise.exercise_id);

        if (!sessionExerciseId) return [];

        const templateSets = (routineExercise.routine_exercise_sets ?? []) as RoutineExerciseSet[];

        return templateSets.map((set) => ({
            workout_session_id: params.sessionId,
            workout_session_exercise_id: sessionExerciseId,
            exercise_id: routineExercise.exercise_id,
            exercise_name_snapshot: routineExercise.exercise?.name ?? "Exercise",
            reps: set.reps,
            weight: set.weight ?? 0,
            is_completed: false,
            is_pr: false,
        }));
    });

    if (workoutSetsToInsert.length > 0) {
        const { error: setsError } = await supabase
            .from("workout_sets")
            .insert(workoutSetsToInsert);

        if (setsError) throw setsError;
    }

    return createdSessionExercises ?? [];
}

export async function deleteRoutineExerciseSetsByRoutineExerciseId(routineExerciseId: string) {
    const { error } = await supabase
        .from("routine_exercise_sets")
        .delete()
        .eq("routine_exercise_id", routineExerciseId);

    if (error) throw error;
}

export async function saveWorkoutSessionSnapshot(params: {
    sessionId: string;
    sessionExercises: WorkoutSessionExercise[];
    savedSets: Record<string, WorkoutSessionSet[]>;
}): Promise<void> {
    const { sessionId, sessionExercises, savedSets } = params;

    /*
     * 1. Read the current persisted snapshot.
     */

    const [
        { data: persistedExercises, error: persistedExercisesError },
        { data: persistedSets, error: persistedSetsError },
    ] = await Promise.all([
        supabase.from("workout_session_exercises").select("id").eq("workout_session_id", sessionId),

        supabase.from("workout_sets").select("id").eq("workout_session_id", sessionId),
    ]);

    if (persistedExercisesError) {
        throw persistedExercisesError;
    }

    if (persistedSetsError) {
        throw persistedSetsError;
    }

    /*
     * 2. Determine which persisted records were removed locally.
     */

    const localExerciseIds = new Set(sessionExercises.map((exercise) => exercise.id));

    const localSets = sessionExercises.flatMap((exercise) => savedSets[exercise.id] ?? []);

    const localSetIds = new Set(localSets.map((workoutSet) => workoutSet.id));

    const removedSetIds = (persistedSets ?? [])
        .map((workoutSet) => workoutSet.id)
        .filter((setId) => !localSetIds.has(setId));

    const removedExerciseIds = (persistedExercises ?? [])
        .map((exercise) => exercise.id)
        .filter((exerciseId) => !localExerciseIds.has(exerciseId));

    /*
     * Delete sets before exercises so the operation does not depend on
     * cascade-delete configuration.
     */

    if (removedSetIds.length > 0) {
        const { error } = await supabase
            .from("workout_sets")
            .delete()
            .eq("workout_session_id", sessionId)
            .in("id", removedSetIds);

        if (error) {
            throw error;
        }
    }

    if (removedExerciseIds.length > 0) {
        const { error } = await supabase
            .from("workout_session_exercises")
            .delete()
            .eq("workout_session_id", sessionId)
            .in("id", removedExerciseIds);

        if (error) {
            throw error;
        }
    }

    /*
     * 3. Insert new exercises and update existing ones.
     *
     * IDs created locally are preserved as the final database IDs.
     */

    if (sessionExercises.length > 0) {
        const exercisesToUpsert = sessionExercises.map((exercise, index) => ({
            id: exercise.id,
            workout_session_id: sessionId,
            exercise_id: exercise.exercise_id,
            exercise_name_snapshot: exercise.exercise_name_snapshot,
            exercise_image_url_snapshot: exercise.exercise_image_url_snapshot ?? null,
            position: exercise.position ?? index,
            rest_seconds: exercise.rest_seconds ?? 90,
            exercise_rest_seconds: exercise.exercise_rest_seconds ?? 120,
        }));

        const { error } = await supabase
            .from("workout_session_exercises")
            .upsert(exercisesToUpsert, {
                onConflict: "id",
            });

        if (error) {
            throw error;
        }
    }

    /*
     * 4. Insert new sets and update existing ones.
     */

    const exerciseById = new Map(sessionExercises.map((exercise) => [exercise.id, exercise]));

    if (localSets.length > 0) {
        const setsToUpsert = localSets.map((workoutSet) => {
            const parentExercise = exerciseById.get(workoutSet.workout_session_exercise_id);

            if (!parentExercise) {
                throw new Error(
                    `Unable to find the parent exercise for workout set ${workoutSet.id}`
                );
            }

            return {
                id: workoutSet.id,
                workout_session_id: sessionId,
                workout_session_exercise_id: parentExercise.id,
                exercise_id: workoutSet.exercise_id ?? parentExercise.exercise_id,
                exercise_name_snapshot: parentExercise.exercise_name_snapshot,
                reps: Number(workoutSet.reps ?? 0),
                weight: Number(workoutSet.weight ?? 0),
                is_completed: workoutSet.is_completed,
                is_pr: workoutSet.is_pr,
                created_at: workoutSet.created_at ?? new Date().toISOString(),
            };
        });

        const { error } = await supabase.from("workout_sets").upsert(setsToUpsert, {
            onConflict: "id",
        });

        if (error) {
            throw error;
        }
    }
}

export async function loadWorkoutSessionSnapshot(params: {
    sessionId: string;
    routineId: string;
    userId: string;
}) {
    let sessionExercises = await getWorkoutSessionExercises(params.sessionId);

    if (sessionExercises.length === 0) {
        sessionExercises = await createWorkoutSessionExercisesFromRoutine({
            sessionId: params.sessionId,
            routineId: params.routineId,
            userId: params.userId,
        });
    }

    const savedSets = await getSavedSets(params.sessionId);

    return {
        sessionExercises,
        savedSets,
    };
}
