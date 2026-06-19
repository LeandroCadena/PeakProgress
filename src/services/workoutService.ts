import { supabase } from "./supabase";
import { RoutineExercise, RoutineExerciseSet, WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";

export async function getRoutineExercises(
    routineId: string
): Promise<RoutineExercise[]> {
    const { data, error } = await supabase
        .from("routine_exercises")
        .select(`
      id,
      exercise_id,
      sets,
      reps,
      weight,
      rest_seconds,
      exercise:exercises (
        name,
        image_url
      )
    `)
        .eq("routine_id", routineId)
        .order("position");

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
        .select("id, routine_exercise_id, set_number, reps, weight")
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
      is_completed
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

export async function updateWorkoutSetValue(params: {
    setId: string;
    field: "weight" | "reps";
    value: number;
}) {
    const { error } = await supabase
        .from("workout_sets")
        .update({
            [params.field]: params.value,
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
    sets: number;
    reps: number;
    weight: number;
    restSeconds: number;
    position: number;
}) {
    const { data, error } = await supabase
        .from("routine_exercises")
        .insert({
            routine_id: params.routineId,
            exercise_id: params.exerciseId,
            sets: 0,
            reps: params.reps,
            weight: params.weight,
            rest_seconds: params.restSeconds,
            position: params.position,
        })
        .select("id")
        .single();

    if (error) throw error;

    return data;
}

export async function getOrCreateActiveWorkoutSession(params: {
    userId: string;
    routineId: string;
}) {
    const { data: existingSession, error: existingError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", params.userId)
        .eq("routine_id", params.routineId)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingError) throw existingError;

    if (existingSession) {
        return existingSession;
    }

    const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
            user_id: params.userId,
            routine_id: params.routineId,
        })
        .select("id")
        .single();

    if (error) throw error;

    await createWorkoutSessionExercisesFromRoutine({
        sessionId: data.id,
        routineId: params.routineId,
    });

    return data;
}

export async function createWorkoutSetsFromTemplate(params: {
    sessionId: string;
    routineId: string;
}) {
    const routineExercises = await getRoutineExercises(params.routineId);
    const routineExerciseIds = routineExercises.map((item) => item.id);
    const templateSetsByExercise = await getRoutineExerciseSets(routineExerciseIds);

    const workoutSets = routineExercises.flatMap((routineExercise) => {
        const templateSets = templateSetsByExercise[routineExercise.id] ?? [];

        return templateSets.map((templateSet) => ({
            workout_session_id: params.sessionId,
            exercise_id: routineExercise.exercise_id,
            exercise_name_snapshot: routineExercise.exercise?.name ?? "Exercise",
            set_number: templateSet.set_number,
            reps: templateSet.reps,
            weight: templateSet.weight ?? 0,
            is_completed: false,
        }));
    });

    if (!workoutSets.length) return;

    const { data: existingSets, error: existingSetsError } = await supabase
        .from("workout_sets")
        .select("id")
        .eq("workout_session_id", params.sessionId)
        .limit(1);

    if (existingSetsError) throw existingSetsError;

    if (existingSets && existingSets.length > 0) {
        return;
    }

    const { error } = await supabase.from("workout_sets").insert(workoutSets);

    if (error) throw error;
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
    sets: number;
    reps: number;
    weight: number;
    restSeconds: number;
}) {
    const { error } = await supabase
        .from("routine_exercises")
        .update({
            sets: params.sets,
            reps: params.reps,
            weight: params.weight,
            rest_seconds: params.restSeconds,
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
    const { data: sessionExercise, error: sessionExerciseError } =
        await supabase
            .from("workout_session_exercises")
            .insert({
                workout_session_id: params.sessionId,
                exercise_id: params.exerciseId,
                exercise_name_snapshot: params.exerciseName,
                position: params.position,
                rest_seconds: 90,
                exercise_image_url_snapshot: params.exerciseImageUrl ?? null,
            })
            .select("id")
            .single();

    if (sessionExerciseError) throw sessionExerciseError;

    const { error: setError } = await supabase.from("workout_sets").insert({
        workout_session_id: params.sessionId,
        workout_session_exercise_id: sessionExercise.id,
        exercise_id: params.exerciseId,
        exercise_name_snapshot: params.exerciseName,
        set_number: 1,
        reps: 0,
        weight: 0,
        is_completed: false,
    });

    if (setError) throw setError;
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
        const firstSet = sets[0];

        const { data: routineExercise, error: routineExerciseError } =
            await supabase
                .from("routine_exercises")
                .insert({
                    routine_id: params.routineId,
                    exercise_id: sessionExercise.exercise_id,
                    position: index,
                    rest_seconds: sessionExercise.rest_seconds ?? 90,
                    sets: sets.length,
                    reps: firstSet
                        ? Number(
                            params.editingValues[`${firstSet.id}-reps`] ??
                            firstSet.reps ??
                            0
                        )
                        : 0,
                    weight: firstSet
                        ? Number(
                            params.editingValues[`${firstSet.id}-weight`] ??
                            firstSet.weight ??
                            0
                        )
                        : 0,
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
      position,
      rest_seconds
    `)
        .eq("workout_session_id", sessionId)
        .order("position", { ascending: true });

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
}) {
    const routineExercises = await getRoutineExercises(params.routineId);

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
                    rest_seconds: routineExercise.rest_seconds ?? 90,
                    exercise_image_url_snapshot: routineExercise.exercise?.image_url ?? null,
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