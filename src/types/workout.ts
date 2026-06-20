export type WorkoutSessionRouteParams = {
    WorkoutSession: {
        sessionId: string;
        routineId: string;
        routineName: string;
    };
};

export type RoutineExercise = {
    id: string;
    routine_id: string;
    exercise_id: string;
    position: number;
    rest_seconds: number;
    exercise_rest_seconds: number;
    current_pr_volume: number;
    exercise: {
        name: string;
        image_url?: string | null;
    } | null;
};

export type RoutineExerciseSet = {
    id: string;
    routine_exercise_id: string;
    set_number: number;
    reps: number;
    weight: number | null;
    is_pr: boolean;
};

export type WorkoutSessionExercise = {
    id: string;
    workout_session_id: string;
    exercise_id: string | null;
    exercise_name_snapshot: string;
    exercise_image_url_snapshot?: string | null;
    position: number;
    rest_seconds: number;
    exercise_rest_seconds: number;
    current_pr_volume: number;
};

export type WorkoutSessionSet = {
    id: string;
    workout_session_exercise_id: string | null;
    exercise_id: string | null;
    set_number: number;
    reps: number;
    weight: number | null;
    is_completed: boolean;
    is_pr: boolean;
};