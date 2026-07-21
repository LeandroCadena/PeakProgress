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
};

type WorkoutSummary = {
    totalSets: number;
    totalVolume: number;
};

type UpdateRoutineFromWorkoutInput = {
    sessionId: string;
    routineId: string;
};

export async function updateRoutineFromCompletedWorkout({
    sessionId,
    routineId,
}: UpdateRoutineFromWorkoutInput): Promise<void> {
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
    savedSets,
}: {
    userId: string;
    savedSets: SavedSetsByExercise;
}) {
    const completedPrSets = Object.values(savedSets)
        .flat()
        .filter(
            (workoutSet) => workoutSet.is_completed && workoutSet.is_pr && workoutSet.exercise_id
        );

    const bestByExercise: Record<
        string,
        {
            setId: string;
            volume: number;
            weight: number;
            reps: number;
        }
    > = {};

    completedPrSets.forEach((workoutSet) => {
        const exerciseId = workoutSet.exercise_id!;

        const weight = Number(workoutSet.weight ?? 0);

        const reps = Number(workoutSet.reps ?? 0);

        const volume = weight * reps;

        const currentBest = bestByExercise[exerciseId];

        if (!currentBest || volume > currentBest.volume) {
            bestByExercise[exerciseId] = {
                setId: workoutSet.id,
                volume,
                weight,
                reps,
            };
        }
    });

    await Promise.all(
        Object.entries(bestByExercise).map(([exerciseId, record]) =>
            upsertUserExerciseRecord({
                userId,
                exerciseId,
                bestVolume: record.volume,
                bestWeight: record.weight,
                bestReps: record.reps,
                bestSetId: record.setId,
            })
        )
    );
}

export async function syncCompletedWorkout({
    sessionId,
    routineName,
    userId,
    sessionExercises,
    savedSets,
}: SyncWorkoutInput): Promise<void> {
    const { totalSets, totalVolume } = calculateWorkoutSummary(savedSets);

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
        userId ? syncExerciseRecords({ userId, savedSets }) : Promise.resolve(),

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
