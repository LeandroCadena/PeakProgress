export type WorkoutSessionRouteParams = {
    WorkoutSession: {
        sessionId: string;
        routineId: string;
        routineName: string;
    };
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
    workout_session_exercise_id: string;
    exercise_id: string | null;
    reps: number;
    weight: number;
    is_completed: boolean;
    is_pr: boolean;
    created_at: string;
};