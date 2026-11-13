import { randomUUID } from "expo-crypto";

import type { WorkoutSessionExercise, WorkoutSessionSet } from "../../types/workout";
import { getDatabase } from "../database";

import { getLocalRoutine } from "./routineRepository";

type SavedSets = Record<string, WorkoutSessionSet[]>;
type WorkoutRow = {
    id: string;
    routine_id: string;
    routine_name_snapshot: string;
    started_at: string;
    completed_at: string | null;
    total_sets: number;
    total_volume: number;
    duration_minutes: number;
    exercises: string | null;
    sets: string | null;
};

export async function getLocalWorkout(sessionId: string, userId: string) {
    const db = await getDatabase();
    return db.getFirstAsync<WorkoutRow>(
        "SELECT * FROM local_workouts WHERE id = ? AND user_id = ?",
        sessionId,
        userId
    );
}

export async function getLocalWorkoutHistory(userId: string) {
    const db = await getDatabase();
    return db.getAllAsync<WorkoutRow>(
        "SELECT * FROM local_workouts WHERE user_id = ? AND completed_at IS NOT NULL ORDER BY started_at DESC",
        userId
    );
}

export async function getLocalActiveWorkout(userId: string) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WorkoutRow>(
        "SELECT * FROM local_workouts WHERE user_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1",
        userId
    );
    return row && { ...row, routines: { name: row.routine_name_snapshot } };
}

export async function createLocalWorkout(userId: string, routineId: string, discardId?: string) {
    const routine = await getLocalRoutine({ userId, routineId });
    if (!routine) throw new Error("Routine not found on this device.");

    const id = randomUUID();
    const startedAt = new Date().toISOString();
    const sessionExercises: WorkoutSessionExercise[] = [];
    const savedSets: SavedSets = {};

    for (const exercise of routine.exercises) {
        const sessionExerciseId = randomUUID();
        sessionExercises.push({
            id: sessionExerciseId,
            workout_session_id: id,
            exercise_id: exercise.exercise_id,
            exercise_name_snapshot: exercise.exercise?.name ?? "",
            exercise_image_url_snapshot: exercise.exercise?.image_url,
            position: exercise.position,
            rest_seconds: exercise.rest_seconds,
            exercise_rest_seconds: exercise.exercise_rest_seconds,
        });
        savedSets[sessionExerciseId] = (routine.setsByExerciseId[exercise.id] ?? []).map((set) => ({
            id: randomUUID(),
            workout_session_exercise_id: sessionExerciseId,
            exercise_id: exercise.exercise_id,
            reps: set.reps,
            weight: set.weight,
            is_completed: false,
            is_pr: false,
            created_at: startedAt,
        }));
    }

    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (tx) => {
        if (discardId) {
            await tx.runAsync(
                "DELETE FROM local_workouts WHERE id = ? AND user_id = ? AND completed_at IS NULL",
                discardId,
                userId
            );
        }
        await tx.runAsync(
            `INSERT INTO local_workouts
                (id, user_id, routine_id, routine_name_snapshot, started_at, exercises, sets)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            id,
            userId,
            routineId,
            routine.name,
            startedAt,
            JSON.stringify(sessionExercises),
            JSON.stringify(savedSets)
        );
    });

    return { id, routine_id: routineId, started_at: startedAt };
}

export function readLocalWorkoutSnapshot(row: WorkoutRow) {
    return {
        sessionExercises: JSON.parse(row.exercises ?? "[]") as WorkoutSessionExercise[],
        savedSets: JSON.parse(row.sets ?? "{}") as SavedSets,
    };
}

export async function completeLocalWorkout(params: {
    userId: string;
    sessionId: string;
    routineName: string;
    sessionExercises: WorkoutSessionExercise[];
    savedSets: SavedSets;
    totalSets: number;
    totalVolume: number;
}) {
    const db = await getDatabase();
    const now = new Date();
    const row = await getLocalWorkout(params.sessionId, params.userId);
    if (!row) throw new Error("Workout not found on this device.");

    const duration = Math.max(1, Math.round((now.getTime() - Date.parse(row.started_at)) / 60_000));
    await db.runAsync(
        `UPDATE local_workouts SET completed_at = ?, routine_name_snapshot = ?, duration_minutes = ?,
            total_sets = ?, total_volume = ?, exercises = ?, sets = ?
         WHERE id = ? AND user_id = ? AND completed_at IS NULL`,
        now.toISOString(),
        params.routineName,
        duration,
        params.totalSets,
        params.totalVolume,
        JSON.stringify(params.sessionExercises),
        JSON.stringify(params.savedSets),
        params.sessionId,
        params.userId
    );
}

export async function getLocalWorkoutEntries(userId: string) {
    const rows = await getLocalWorkoutHistory(userId);
    return rows.flatMap((row) => {
        const { sessionExercises, savedSets } = readLocalWorkoutSnapshot(row);
        return sessionExercises.flatMap((exercise) =>
            (savedSets[exercise.id] ?? [])
                .filter((set) => set.is_completed)
                .map((set) => ({
                    ...set,
                    exercise_name_snapshot: exercise.exercise_name_snapshot,
                }))
        );
    });
}
