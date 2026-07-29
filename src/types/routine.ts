export type Routine = {
    imageUrl?: string;
    id: string;
    name: string;
};

export type RoutineExercise = {
    id: string;
    routine_id: string;
    exercise_id: string;
    position: number;
    rest_seconds: number;
    exercise_rest_seconds: number;
    exercise: {
        name: string;
        image_url?: string | null;
    } | null;
};

export type RoutineExerciseSet = {
    id: string;
    routine_exercise_id: string;
    reps: number;
    weight: number;
    is_pr: boolean;
    created_at: string;
};
