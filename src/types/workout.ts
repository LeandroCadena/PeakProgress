export type WorkoutSessionRouteParams = {
    WorkoutSession: {
        sessionId: string;
        routineId: string;
        routineName: string;
    };
};

export type RoutineExercise = {
    id: string;
    exercise_id: string;
    sets: number;
    reps: number;
    weight: number | null;
    rest_seconds: number;
    exercise: {
        name: string;
    } | null;
};

export type SavedSet = {
    id: string;
    exercise_id: string;
    set_number: number;
    reps: number;
    weight: number | null;
    is_completed: boolean;
};