import { supabase } from "./supabase";
import { RoutineExercise, RoutineExerciseSet, SavedSet } from "../types/workout";

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
        name
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
): Promise<Record<string, SavedSet[]>> {
    const { data, error } = await supabase
        .from("workout_sets")
        .select("id, exercise_id, set_number, reps, weight, is_completed")
        .eq("workout_session_id", sessionId)
        .order("set_number", { ascending: true });

    if (error) {
        throw error;
    }

    const grouped: Record<string, SavedSet[]> = {};

    data?.forEach((set) => {
        if (!grouped[set.exercise_id]) {
            grouped[set.exercise_id] = [];
        }

        grouped[set.exercise_id].push(set as SavedSet);
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
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    reps: number;
    weight: number;
}) {
    const { error } = await supabase.from("workout_sets").insert({
        workout_session_id: params.sessionId,
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
        .select("reps, weight")
        .eq("workout_session_id", params.sessionId);

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

    await createWorkoutSetsFromTemplate({
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