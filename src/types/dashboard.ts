export type DashboardStats = {
    routinesCount: number;
    completedWorkouts: number;
    lastWorkoutName: string | null;
    streakWeeks: number;
    streakWorkouts: number;
    streakStatus: "empty" | "active" | "warning" | "expired";
    streakDaysRemaining: number | null;
};

export type RecentWorkout = {
    id: string;
    routine_name_snapshot: string | null;
    started_at: string;
    completed_at: string;
    workout_session_exercises?: { id: string }[];
};