import { randomUUID } from "expo-crypto";

import { GUEST_USER_ID } from "../database/guestAccount";
import {
    completeLocalWorkout,
    getLocalWorkout,
    readLocalWorkoutSnapshot,
} from "../database/repositories/localWorkoutRepository";
import { getLocalRoutine, saveLocalRoutine } from "../database/repositories/routineRepository";
import { ExerciseRecordCandidatesById } from "../types/progress";
import { WorkoutSessionExercise, WorkoutSessionSet } from "../types/workout";

import { upsertUserExerciseRecord } from "./progressService";
import { updateWorkoutStreakAfterFinish } from "./streakService";
import {
    finishWorkoutSession,
    getSavedSets,
    getWorkoutSessionExercises,
    saveWorkoutSessionSnapshot,
    syncWorkoutSessionToRoutine,
} from "./workoutService";

type SavedSetsByExercise = Record<string, WorkoutSessionSet[]>;

type SyncWorkoutInput = {
    sessionId: string;
    routineName: string;
    userId: string | null;
    sessionExercises: WorkoutSessionExercise[];
    savedSets: SavedSetsByExercise;
    exerciseRecordCandidatesById: ExerciseRecordCandidatesById;
};

type WorkoutSummary = {
    totalSets: number;
    totalVolume: number;
};

type UpdateRoutineFromWorkoutInput = {
    userId: string;
    sessionId: string;
    routineId: string;
};

export async function updateRoutineFromCompletedWorkout({
    sessionId,
    routineId,
    userId,
}: UpdateRoutineFromWorkoutInput): Promise<void> {
    const local = await getLocalWorkout(sessionId, userId);
    if (local) {
        const { sessionExercises, savedSets } = readLocalWorkoutSnapshot(local);
        const routine = await getLocalRoutine({ userId, routineId });
        if (!routine) throw new Error("Routine not found on this device.");

        const exercises = sessionExercises.map((exercise, position) => ({
            id: randomUUID(),
            routine_id: routineId,
            exercise_id: exercise.exercise_id,
            position,
            rest_seconds: exercise.rest_seconds,
            exercise_rest_seconds: exercise.exercise_rest_seconds,
            exercise: {
                name: exercise.exercise_name_snapshot,
                image_url: exercise.exercise_image_url_snapshot,
            },
        }));
        const setsByExerciseId = Object.fromEntries(
            exercises.map((exercise, index) => [
                exercise.id,
                (savedSets[sessionExercises[index].id] ?? []).map((set) => ({
                    ...set,
                    id: randomUUID(),
                    routine_exercise_id: exercise.id,
                })),
            ])
        );

        await saveLocalRoutine({
            userId,
            syncOperationId: randomUUID(),
            snapshot: { ...routine, exercises, setsByExerciseId },
        });
        return;
    }
    if (userId === GUEST_USER_ID) throw new Error("Workout not found on this device.");

    const [sessionExercises, savedSets] = await Promise.all([
        getWorkoutSessionExercises(sessionId),
        getSavedSets(sessionId),
    ]);

    await syncWorkoutSessionToRoutine({
        routineId,
        sessionExercises,
        savedSets,
        editingValues: {},
    });
}

async function syncExerciseRecords({
    userId,
    exerciseRecordCandidatesById,
}: {
    userId: string;
    exerciseRecordCandidatesById: ExerciseRecordCandidatesById;
}) {
    const recordPromises = Object.entries(exerciseRecordCandidatesById).flatMap(
        ([exerciseId, candidates]) => {
            const bestCandidate = candidates.at(-1);

            if (!bestCandidate) {
                return [];
            }

            return [
                upsertUserExerciseRecord({
                    userId,
                    exerciseId,
                    bestVolume: bestCandidate.volume,
                    bestWeight: bestCandidate.weight,
                    bestReps: bestCandidate.reps,
                    bestSetId: bestCandidate.setId,
                }),
            ];
        }
    );

    await Promise.all(recordPromises);
}

export async function syncCompletedWorkout({
    sessionId,
    routineName,
    userId,
    sessionExercises,
    savedSets,
    exerciseRecordCandidatesById,
}: SyncWorkoutInput): Promise<void> {
    const { totalSets, totalVolume } = calculateWorkoutSummary(savedSets);

    if (userId && (userId === GUEST_USER_ID || (await getLocalWorkout(sessionId, userId)))) {
        await completeLocalWorkout({
            userId,
            sessionId,
            routineName,
            sessionExercises,
            savedSets,
            totalSets,
            totalVolume,
        });
        return;
    }

    await saveWorkoutSessionSnapshot({
        sessionId,
        sessionExercises,
        savedSets,
    });

    await finishWorkoutSession({
        sessionId,
        routineName,
        totalSets,
        totalVolume,
    });

    await Promise.all([
        userId ? syncExerciseRecords({ userId, exerciseRecordCandidatesById }) : Promise.resolve(),

        userId ? updateWorkoutStreakAfterFinish(userId) : Promise.resolve(),
    ]);
}

function calculateWorkoutSummary(savedSets: SavedSetsByExercise): WorkoutSummary {
    const completedSets = Object.values(savedSets)
        .flat()
        .filter((workoutSet) => workoutSet.is_completed);

    const totalVolume = completedSets.reduce((total, workoutSet) => {
        const weight = Number(workoutSet.weight ?? 0);

        const reps = Number(workoutSet.reps ?? 0);

        return total + weight * reps;
    }, 0);

    return {
        totalSets: completedSets.length,
        totalVolume,
    };
}
