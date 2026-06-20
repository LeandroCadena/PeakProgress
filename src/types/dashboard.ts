export type DashboardStats = {
    routinesCount: number;
    completedWorkouts: number;
    lastWorkoutName: string | null;
    streakWeeks: number;
    streakWorkouts: number;
    streakStatus: "empty" | "active" | "warning" | "expired";
    streakDaysRemaining: number | null;
};