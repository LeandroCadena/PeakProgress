import { supabase } from "./supabase";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";
import { RoutineExercise, RoutineExerciseSet } from "../types/routine";
import { getUserSettings } from "./settingsService";
import { getUserExerciseBestVolume } from "./progressService";

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
        position,
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
        .select(`
        id,
        routine_exercise_id,
        reps,
        weight,
        is_pr,
        created_at
        `)
        .in("routine_exercise_id", routineExerciseIds)
        .order("created_at", { ascending: true });

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
        reps,
        weight,
        is_completed,
        is_pr,
        created_at
        `)
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

export async function createWorkoutSet(params: {
    sessionId: string;
    exerciseId: string;
    reps: number;
    weight: number;
}) {
    const { data, error } = await supabase
        .from("workout_sets")
        .insert({
            workout_session_id: params.sessionId,
            exercise_id: params.exerciseId,
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
    reps: number;
    weight: number;
}) {
    const { data, error } = await supabase
        .from("workout_sets")
        .insert({
            workout_session_id: params.sessionId,
            workout_session_exercise_id: params.workoutSessionExerciseId,
            exercise_id: params.exerciseId,
            exercise_name_snapshot: params.exerciseName,
            reps: params.reps,
            weight: params.weight,
            is_completed: false,
            is_pr: false,
        })
        .select(`
        id,
        workout_session_exercise_id,
        exercise_id,
        reps,
        weight,
        is_completed,
        is_pr
        `)
        .single();

    if (error) throw error;

    return data as WorkoutSessionSet;
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
    reps: number;
    weight: number;
}) {
    const { data, error } = await supabase
        .from("routine_exercise_sets")
        .insert({
            routine_exercise_id: params.routineExerciseId,
            reps: params.reps,
            weight: params.weight,
            is_pr: false,
        })
        .select(`
            id, 
            routine_exercise_id, 
            reps, 
            weight, 
            is_pr,
            created_at
            `)
        .single();

    if (error) throw error;

    return data as RoutineExerciseSet;
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
    userId: string;
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    position: number;
    exerciseImageUrl?: string | null;
}) {
    await createWorkoutSessionExercise({
        sessionId: params.sessionId,
        exerciseId: params.exerciseId,
        exerciseName: params.exerciseName,
        exerciseImageUrl: params.exerciseImageUrl,
        position: params.position,
        userId: params.userId,
    });
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

    const exercisesToInsert = params.sessionExercises
        .filter((sessionExercise) => sessionExercise.exercise_id)
        .map((sessionExercise, index) => ({
            routine_id: params.routineId,
            exercise_id: sessionExercise.exercise_id,
            position: index,
            rest_seconds: sessionExercise.rest_seconds ?? 90,
            exercise_rest_seconds: sessionExercise.exercise_rest_seconds ?? 120,
            current_pr_volume: sessionExercise.current_pr_volume ?? 0,
            session_exercise_id: sessionExercise.id,
        }));

    const { data: createdRoutineExercises, error: routineExercisesError } =
        await supabase
            .from("routine_exercises")
            .insert(
                exercisesToInsert.map(({ session_exercise_id, ...item }) => item)
            )
            .select("id, exercise_id");

    if (routineExercisesError) throw routineExercisesError;

    const createdRoutineExercisesWithSessionIds =
        createdRoutineExercises?.map((routineExercise, index) => ({
            ...routineExercise,
            session_exercise_id: exercisesToInsert[index].session_exercise_id,
        })) ?? [];

    const routineExerciseIdBySessionExerciseId = new Map(
        createdRoutineExercisesWithSessionIds.map((item) => [
            item.session_exercise_id,
            item.id,
        ])
    );

    const setsToInsert = params.sessionExercises.flatMap((sessionExercise) => {
        const routineExerciseId = routineExerciseIdBySessionExerciseId.get(
            sessionExercise.id
        );

        if (!routineExerciseId) return [];

        const sets = params.savedSets[sessionExercise.id] ?? [];

        return sets.map((set) => ({
            routine_exercise_id: routineExerciseId,
            reps: Number(
                params.editingValues[`${set.id}-reps`] ?? set.reps ?? 0
            ),
            weight: Number(
                params.editingValues[`${set.id}-weight`] ?? set.weight ?? 0
            ),
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
    const settings = await getUserSettings(params.userId);
    const routineExercises = await getRoutineExercisesWithSets(params.routineId);

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

    const sessionExercisesToInsert = routineExercises.map((routineExercise) => ({
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
    }));

    const { data: createdSessionExercises, error: sessionExercisesError } =
        await supabase
            .from("workout_session_exercises")
            .insert(sessionExercisesToInsert)
            .select(`
        id,
        workout_session_id,
        exercise_id,
        exercise_name_snapshot,
        exercise_image_url_snapshot,
        exercise_rest_seconds,
        position,
        rest_seconds,
        current_pr_volume,
        created_at
        `);

    if (sessionExercisesError) throw sessionExercisesError;

    const sessionExerciseIdByExerciseId = new Map(
        (createdSessionExercises ?? []).map((item) => [
            item.exercise_id,
            item.id,
        ])
    );

    const workoutSetsToInsert = routineExercises.flatMap((routineExercise) => {
        const sessionExerciseId = sessionExerciseIdByExerciseId.get(
            routineExercise.exercise_id
        );

        if (!sessionExerciseId) return [];

        const templateSets =
            (routineExercise.routine_exercise_sets ?? []) as RoutineExerciseSet[];

        return templateSets.map((set) => ({
            workout_session_id: params.sessionId,
            workout_session_exercise_id: sessionExerciseId,
            exercise_id: routineExercise.exercise_id,
            exercise_name_snapshot:
                routineExercise.exercise?.name ?? "Exercise",
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

    return createWorkoutSession({
        userId: params.userId,
        routineId: params.routineId,
    });
}

export async function createNewWorkoutSessionFromRoutine(params: {
    userId: string;
    routineId: string;
}) {
    const session = await createWorkoutSession(params);

    await createWorkoutSessionExercisesFromRoutine({
        sessionId: session.id,
        routineId: params.routineId,
        userId: params.userId,
    });

    return session;
}

export async function createWorkoutSession(params: {
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

async function createWorkoutSessionExercise(params: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    position: number;
    userId: string;
    exerciseImageUrl?: string | null;
    routineSetRestSeconds?: number;
    routineExerciseRestSeconds?: number;
    routineCurrentPrVolume?: number;
}) {
    const settings = await getUserSettings(params.userId);

    const currentPrVolume =
        params.routineCurrentPrVolume ??
        (await getUserExerciseBestVolume({
            userId: params.userId,
            exerciseId: params.exerciseId,
        }));

    const { data, error } = await supabase
        .from("workout_session_exercises")
        .insert({
            workout_session_id: params.sessionId,
            exercise_id: params.exerciseId,
            exercise_name_snapshot: params.exerciseName,
            position: params.position,
            exercise_image_url_snapshot: params.exerciseImageUrl ?? null,
            rest_seconds: settings.use_global_timers
                ? settings.global_set_rest_seconds
                : params.routineSetRestSeconds ?? 90,
            exercise_rest_seconds: settings.use_global_timers
                ? settings.global_exercise_rest_seconds
                : params.routineExerciseRestSeconds ?? 120,
            current_pr_volume: currentPrVolume,
        })
        .select("id")
        .single();

    if (error) throw error;

    return data;
}

async function getRoutineExercisesWithSets(routineId: string) {
    const { data, error } = await supabase
        .from("routine_exercises")
        .select(`
            id,
            exercise_id,
            position,
            rest_seconds,
            exercise_rest_seconds,
            current_pr_volume,
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
        `)
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