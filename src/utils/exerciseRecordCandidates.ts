import type { ExerciseRecordCandidate, UserExerciseRecord } from "../types/progress";

type CreateExerciseRecordCandidateParams = {
    historicalRecord?: UserExerciseRecord;
    currentCandidates: ExerciseRecordCandidate[];

    setId: string;
    weight: number;
    reps: number;
};

export function createExerciseRecordCandidate({
    historicalRecord,
    currentCandidates,
    setId,
    weight,
    reps,
}: CreateExerciseRecordCandidateParams): ExerciseRecordCandidate | null {
    const volume = weight * reps;

    const historicalVolume = historicalRecord?.bestVolume ?? 0;

    if (volume <= historicalVolume) {
        return null;
    }

    const currentHighestVolume = currentCandidates.at(-1)?.volume ?? historicalVolume;

    return {
        setId,
        weight,
        reps,
        volume,
        isPersonalRecord: volume > currentHighestVolume,
    };
}
