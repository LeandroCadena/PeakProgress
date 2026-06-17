export type FilterMode = "muscle" | "region";

export type Exercise = {
    id: string;
    name: string;
    equipment: string | null;
    difficulty: string | null;
};

export type Muscle = {
    id: string;
    name: string;
};

export type MuscleRegion = {
    id: string;
    name: string;
};

export type ExerciseWithRelations = Exercise & {
    exercise_muscles?: {
        muscle_id: string;
        muscles?: {
            region_id: string | null;
        } | null;
    }[];
};