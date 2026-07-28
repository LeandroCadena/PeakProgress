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
