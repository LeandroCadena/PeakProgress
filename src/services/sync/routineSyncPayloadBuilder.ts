import { getLocalRoutine } from "../../database/repositories/routineRepository";

import type { RoutineSyncPayload } from "./routineSyncRpcService";

/**
 * Builds a full upsert payload from the current local routine.
 * Do not use this to rebuild an already-enqueued operation: retries must
 * send the original immutable payload and operation ID.
 */
export async function buildRoutineSyncPayload(params: {
    userId: string;
    routineId: string;
}): Promise<RoutineSyncPayload> {
    const { userId, routineId } = params;
    const snapshot = await getLocalRoutine({ userId, routineId });

    if (!snapshot) {
        throw new Error("Local routine not found or has been deleted.");
    }
    if (snapshot.routineId !== routineId) {
        throw new Error("Local routine ID mismatch.");
    }
    if (!snapshot.name.trim()) {
        throw new Error("Routine name is required.");
    }

    const exerciseIds = new Set<string>();
    const setIds = new Set<string>();
    const exercises: RoutineSyncPayload["exercises"] = [];
    const setsByExerciseId: RoutineSyncPayload["setsByExerciseId"] = {};

    for (const exercise of snapshot.exercises) {
        if (exerciseIds.has(exercise.id)) {
            throw new Error(`Duplicate routine exercise ID: ${exercise.id}`);
        }
        if (exercise.routine_id !== routineId) {
            throw new Error(`Exercise belongs to another routine: ${exercise.id}`);
        }
        exerciseIds.add(exercise.id);

        exercises.push({
            id: exercise.id,
            exercise_id: exercise.exercise_id,
            position: exercise.position,
            rest_seconds: exercise.rest_seconds,
            exercise_rest_seconds: exercise.exercise_rest_seconds ?? null,
            notes: null,
        });

        setsByExerciseId[exercise.id] = (snapshot.setsByExerciseId[exercise.id] ?? []).map(
            (set) => {
                if (set.routine_exercise_id !== exercise.id) {
                    throw new Error(`Set ${set.id} belongs to another exercise.`);
                }
                if (setIds.has(set.id)) {
                    throw new Error(`Duplicate routine set ID: ${set.id}`);
                }
                setIds.add(set.id);
                return {
                    id: set.id,
                    routine_exercise_id: set.routine_exercise_id,
                    reps: set.reps,
                    weight: set.weight ?? null,
                    is_pr: Boolean(set.is_pr),
                };
            }
        );
    }

    for (const key of Object.keys(snapshot.setsByExerciseId)) {
        if (!exerciseIds.has(key) && snapshot.setsByExerciseId[key]?.length) {
            throw new Error(`Orphan set group for exercise: ${key}`);
        }
    }

    return {
        routineId: snapshot.routineId,
        name: snapshot.name,
        exercises,
        setsByExerciseId,
    };
}
