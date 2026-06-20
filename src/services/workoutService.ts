import { supabase } from "./supabase";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";
import { RoutineExercise, RoutineExerciseSet } from "../types/routine";
import { getUserSettings } from "./settingsService";

export async function getRoutineExercises(
    routineId: string
): Promise<RoutineExercise[]> {
    const { data, error } = await supabase
        .from("routine_exercises")
        .select(`
        id,
        exercise_id,
        rest_seconds,
        exercise_rest_seconds,
        current_pr_volume,
        exercise:exercises (
            name,
            image_url
        )
        `)
        .eq("routine_id", routineId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return (data ?? []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
    })) as RoutineExercise[];
}

export async function getRoutineExerciseSets(
    routineExerciseIds: string[]
): Promise<Record<string, RoutineExerciseSet[]>> {
    if (!routineExerciseIds.length) return {};

    const { data, error } = await supabase
        .from("routine_exercise_sets")
        .select("id, routine_exercise_id, set_number, reps, weight, is_pr")
        .in("routine_exercise_id", routineExerciseIds)
        .order("set_number", { ascending: true });

    if (error) throw error;

    const grouped: Record<string, RoutineExerciseSet[]> = {};

    data?.forEach((set) => {
        if (!grouped[set.routine_exercise_id]) {
            grouped[set.routine_exercise_id] = [];
        }

        grouped[set.routine_exercise_id].push(set as RoutineExerciseSet);
    });

    return grouped;
}

export async function getSavedSets(
    sessionId: string
): Promise<Record<string, WorkoutSessionSet[]>> {
    const { data, error } = await supabase
        .from("workout_sets")
        .select(`
        id,
        workout_session_exercise_id,
        exercise_id,
        set_number,
        reps,
        weight,
        is_completed,
        is_pr
        `)
        .eq("workout_session_id", sessionId)
        .order("set_number", { ascending: true });

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

export async function createWorkoutSet(params: {
    sessionId: string;
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight: number;
}) {
    const { data, error } = await supabase
        .from("workout_sets")
        .insert({
            workout_session_id: params.sessionId,
            exercise_id: params.exerciseId,
            set_number: params.setNumber,
            reps: params.reps,
            weight: params.weight,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
}

export async function updateWorkoutSetValues(params: {
    setId: string;
    weight: number;
    reps: number;
    isPr: boolean;
}) {
    const { error } = await supabase
        .from("workout_sets")
        .update({
            weight: params.weight,
            reps: params.reps,
            is_pr: params.isPr,
        })
        .eq("id", params.setId);

    if (error) throw error;
}

export async function toggleWorkoutSetCompleted(params: {
    setId: string;
    isCompleted: boolean;
}) {
    const { error } = await supabase
        .from("workout_sets")
        .update({
            is_completed: !params.isCompleted,
        })
        .eq("id", params.setId);

    if (error) throw error;
}

export async function deleteWorkoutSet(setId: string) {
    const { error } = await supabase
        .from("workout_sets")
        .delete()
        .eq("id", setId);

    if (error) throw error;
}

export async function createEmptyWorkoutSet(params: {
    sessionId: string;
    workoutSessionExerciseId: string;
    exerciseId: string | null;
    exerciseName: string;
    setNumber: number;
    reps: number;
    weight: number;
}) {
    const { error } = await supabase.from("workout_sets").insert({
        workout_session_id: params.sessionId,
        workout_session_exercise_id: params.workoutSessionExerciseId,
        exercise_id: params.exerciseId,
        exercise_name_snapshot: params.exerciseName,
        set_number: params.setNumber,
        reps: params.reps,
        weight: params.weight,
        is_completed: false,
    });

    if (error) throw error;
}

export async function finishWorkoutSession(params: {
    sessionId: string;
    routineName: string;
}) {
    const completedAt = new Date().toISOString();

    const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("id", params.sessionId)
        .single();

    if (sessionError) throw sessionError;

    const { data: sets, error: setsError } = await supabase
        .from("workout_sets")
        .select("reps, weight, is_completed")
        .eq("workout_session_id", params.sessionId)
        .eq("is_completed", true);

    if (setsError) throw setsError;

    const totalSets = sets?.length ?? 0;

    const totalVolume =
        sets?.reduce((sum, set) => {
            return sum + Number(set.weight ?? 0) * Number(set.reps ?? 0);
        }, 0) ?? 0;

    const start = new Date(session.started_at).getTime();
    const end = new Date(completedAt).getTime();

    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

    const { data, error } = await supabase
        .from("workout_sessions")
        .update({
            completed_at: completedAt,
            routine_name_snapshot: params.routineName,
            total_sets: totalSets,
            total_volume: totalVolume,
            duration_minutes: durationMinutes,
        })
        .eq("id", params.sessionId)
        .select("id, completed_at")
        .single();

    if (error) throw error;

    return data;
}

export async function addExerciseToRoutine(params: {
    routineId: string;
    exerciseId: string;
    restSeconds: number;
    position: number;
    currentPrVolume?: number;
}) {
    const { data, error } = await supabase
        .from("routine_exercises")
        .insert({
            routine_id: params.routineId,
            exercise_id: params.exerciseId,
            rest_seconds: params.restSeconds,
            position: params.position,
            current_pr_volume: params.currentPrVolume ?? 0,
        })
        .select("id")
        .single();

    if (error) throw error;

    return data;
}

export async function updateRoutineExerciseSet(params: {
    setId: string;
    field: "weight" | "reps";
    value: number;
}) {
    const { error } = await supabase
        .from("routine_exercise_sets")
        .update({
            [params.field]: params.value,
        })
        .eq("id", params.setId);

    if (error) throw error;
}

export async function createRoutineExerciseSet(params: {
    routineExerciseId: string;
    setNumber: number;
    reps: number;
    weight: number;
}) {
    const { error } = await supabase.from("routine_exercise_sets").insert({
        routine_exercise_id: params.routineExerciseId,
        set_number: params.setNumber,
        reps: params.reps,
        weight: params.weight,
    });

    if (error) throw error;
}

export async function deleteRoutineExerciseSet(setId: string) {
    const { error } = await supabase
        .from("routine_exercise_sets")
        .delete()
        .eq("id", setId);

    if (error) throw error;
}

export async function deleteRoutineExercise(routineExerciseId: string) {
    const { error } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", routineExerciseId);

    if (error) throw error;
}

export async function updateRoutineExerciseConfig(params: {
    routineExerciseId: string;
    restSeconds: number;
    exerciseRestSeconds: number;
}) {
    const { error } = await supabase
        .from("routine_exercises")
        .update({
            rest_seconds: params.restSeconds,
            exercise_rest_seconds: params.exerciseRestSeconds,
        })
        .eq("id", params.routineExerciseId);

    if (error) throw error;
}

export async function updateRoutineExercisePosition(params: {
    routineExerciseId: string;
    position: number;
}) {
    const { error } = await supabase
        .from("routine_exercises")
        .update({
            position: params.position,
        })
        .eq("id", params.routineExerciseId);

    if (error) throw error;
}

export async function addExerciseToWorkoutSession(params: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    position: number;
    exerciseImageUrl?: string | null;
}) {
    const { error: sessionExerciseError } =
        await supabase
            .from("workout_session_exercises")
            .insert({
                workout_session_id: params.sessionId,
                exercise_id: params.exerciseId,
                exercise_name_snapshot: params.exerciseName,
                position: params.position,
                exercise_rest_seconds: 120,
                rest_seconds: 90,
                exercise_image_url_snapshot: params.exerciseImageUrl ?? null,
            })
            .select("id")
            .single();

    if (sessionExerciseError) throw sessionExerciseError;
}

export async function syncWorkoutSessionToRoutine(params: {
    routineId: string;
    sessionExercises: WorkoutSessionExercise[];
    savedSets: Record<string, WorkoutSessionSet[]>;
    editingValues: Record<string, string>;
}) {
    await supabase
        .from("routine_exercises")
        .delete()
        .eq("routine_id", params.routineId);

    for (let index = 0; index < params.sessionExercises.length; index++) {
        const sessionExercise = params.sessionExercises[index];

        if (!sessionExercise.exercise_id) continue;

        const sets = params.savedSets[sessionExercise.id] ?? [];

        const { data: routineExercise, error: routineExerciseError } =
            await supabase
                .from("routine_exercises")
                .insert({
                    routine_id: params.routineId,
                    exercise_id: sessionExercise.exercise_id,
                    position: index,
                    rest_seconds: sessionExercise.rest_seconds ?? 90,
                    exercise_rest_seconds: sessionExercise.exercise_rest_seconds ?? 120,
                    current_pr_volume: sessionExercise.current_pr_volume ?? 0,
                })
                .select("id")
                .single();

        if (routineExerciseError) throw routineExerciseError;

        if (!sets.length) continue;

        const routineSets = sets.map((set) => ({
            routine_exercise_id: routineExercise.id,
            set_number: set.set_number,
            reps: Number(
                params.editingValues[`${set.id}-reps`] ?? set.reps ?? 0
            ),
            weight: Number(
                params.editingValues[`${set.id}-weight`] ?? set.weight ?? 0
            ),
        }));

        const { error: routineSetsError } = await supabase
            .from("routine_exercise_sets")
            .insert(routineSets);

        if (routineSetsError) throw routineSetsError;
    }
}

export async function getWorkoutSessionExercises(
    sessionId: string
): Promise<WorkoutSessionExercise[]> {
    const { data, error } = await supabase
        .from("workout_session_exercises")
        .select(`
        id,
        workout_session_id,
        exercise_id,
        exercise_name_snapshot,
        exercise_image_url_snapshot,
        exercise_rest_seconds,
        position,
        rest_seconds,
        current_pr_volume
        `)
        .eq("workout_session_id", sessionId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data ?? [];
}

export async function deleteExerciseFromWorkoutSession(params: {
    sessionId: string;
    exerciseId: string;
}) {
    const { error } = await supabase
        .from("workout_sets")
        .delete()
        .eq("workout_session_id", params.sessionId)
        .eq("exercise_id", params.exerciseId);

    if (error) throw error;
}

export async function createWorkoutSessionExercisesFromRoutine(params: {
    sessionId: string;
    routineId: string;
    userId: string;
}) {
    const routineExercises = await getRoutineExercises(params.routineId);

    const settings = await getUserSettings(params.userId);

    const exerciseIds = routineExercises.map((item) => item.exercise_id);

    const { data: records, error: recordsError } = await supabase
        .from("user_exercise_records")
        .select("exercise_id, best_volume")
        .eq("user_id", params.userId)
        .in("exercise_id", exerciseIds);

    if (recordsError) throw recordsError;

    const prByExerciseId = new Map(
        (records ?? []).map((record) => [
            record.exercise_id,
            Number(record.best_volume ?? 0),
        ])
    );

    const routineExerciseSets = await getRoutineExerciseSets(
        routineExercises.map((item) => item.id)
    );

    for (const routineExercise of routineExercises) {
        const { data: sessionExercise, error: sessionExerciseError } =
            await supabase
                .from("workout_session_exercises")
                .insert({
                    workout_session_id: params.sessionId,
                    exercise_id: routineExercise.exercise_id,
                    exercise_name_snapshot: routineExercise.exercise?.name ?? "Exercise",
                    position: routineExercise.position ?? 0,
                    exercise_image_url_snapshot: routineExercise.exercise?.image_url ?? null,
                    rest_seconds: settings.use_global_timers
                        ? settings.global_set_rest_seconds
                        : routineExercise.rest_seconds ?? 90,
                    exercise_rest_seconds: settings.use_global_timers
                        ? settings.global_exercise_rest_seconds
                        : routineExercise.exercise_rest_seconds ?? 120,
                    current_pr_volume:
                        prByExerciseId.get(routineExercise.exercise_id) ??
                        Number(routineExercise.current_pr_volume ?? 0),
                })
                .select("id")
                .single();

        if (sessionExerciseError) throw sessionExerciseError;

        const templateSets = routineExerciseSets[routineExercise.id] ?? [];

        if (!templateSets.length) continue;

        const workoutSets = templateSets.map((set) => ({
            workout_session_id: params.sessionId,
            workout_session_exercise_id: sessionExercise.id,
            exercise_id: routineExercise.exercise_id,
            exercise_name_snapshot: routineExercise.exercise?.name ?? "Exercise",
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight ?? 0,
            is_completed: false,
        }));

        const { error: setsError } = await supabase
            .from("workout_sets")
            .insert(workoutSets);

        if (setsError) throw setsError;
    }
}

export async function deleteWorkoutSessionExercise(
    workoutSessionExerciseId: string
) {
    const { error } = await supabase
        .from("workout_session_exercises")
        .delete()
        .eq("id", workoutSessionExerciseId);

    if (error) throw error;
}

export async function deleteRoutineExerciseSetsByRoutineExerciseId(
    routineExerciseId: string
) {
    const { error } = await supabase
        .from("routine_exercise_sets")
        .delete()
        .eq("routine_exercise_id", routineExerciseId);

    if (error) throw error;
}

export async function createRoutineExerciseSets(
    sets: {
        routine_exercise_id: string;
        set_number: number;
        reps: number;
        weight: number;
    }[]
) {
    if (!sets.length) return;

    const { error } = await supabase
        .from("routine_exercise_sets")
        .insert(sets);

    if (error) throw error;
}

export async function getActiveWorkoutSession(userId: string) {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select(`
      id,
      routine_id,
      started_at,
      rest_timer_end_at,
      last_rest_duration_seconds,
      routines (
        name
      )
    `)
        .eq("user_id", userId)
        .is("completed_at", null)
        .is("discarded_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

    return createNewWorkoutSessionFromRoutine({
        userId: params.userId,
        routineId: params.routineId,
    });
}

export async function createNewWorkoutSessionFromRoutine(params: {
    userId: string;
    routineId: string;
}) {
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

    await createWorkoutSessionExercisesFromRoutine({
        sessionId: data.id,
        routineId: params.routineId,
        userId: params.userId,
    });

    return data;
}

export async function updateWorkoutSessionExerciseRest(params: {
    workoutSessionExerciseId: string;
    restSeconds?: number;
    exerciseRestSeconds?: number;
}) {
    const updates: Record<string, number> = {};

    if (params.restSeconds !== undefined) {
        updates.rest_seconds = params.restSeconds;
    }

    if (params.exerciseRestSeconds !== undefined) {
        updates.exercise_rest_seconds = params.exerciseRestSeconds;
    }

    const { error } = await supabase
        .from("workout_session_exercises")
        .update(updates)
        .eq("id", params.workoutSessionExerciseId);

    if (error) throw error;
}

export async function getWorkoutSessionTimer(sessionId: string) {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select("rest_timer_end_at, last_rest_duration_seconds")
        .eq("id", sessionId)
        .single();

    if (error) throw error;

    return data;
}

export async function updateWorkoutSessionTimer(params: {
    sessionId: string;
    restTimerEndAt: string | null;
    lastRestDurationSeconds?: number | null;
}) {
    const { error } = await supabase
        .from("workout_sessions")
        .update({
            rest_timer_end_at: params.restTimerEndAt,
            last_rest_duration_seconds:
                params.lastRestDurationSeconds ?? null,
        })
        .eq("id", params.sessionId);

    if (error) throw error;
}

export async function updateWorkoutSetValue(params: {
    setId: string;
    field: "weight" | "reps" | "is_pr";
    value: number | boolean;
}) {
    const { error } = await supabase
        .from("workout_sets")
        .update({
            [params.field]: params.value,
        })
        .eq("id", params.setId);

    if (error) throw error;
}