export type ExerciseProgress = {
    exerciseId: string;
    exerciseName: string;
    bestVolume: number;
    bestWeight: number;
    bestReps: number;
};

export type UserExerciseRecord = {
    exerciseId: string;
    bestVolume: number;
    bestWeight: number;
    bestReps: number;
    bestSetId: string | null;
};

export type ExerciseRecordsById = Record<string, UserExerciseRecord>;

export type ExerciseRecordCandidate = {
    setId: string;
    weight: number;
    reps: number;
    volume: number;
    isPersonalRecord: boolean;
};

export type ExerciseRecordCandidatesById = Record<string, ExerciseRecordCandidate[]>;
