export type DashboardStats = {
    routinesCount: number;
    completedWorkouts: number;
    totalSets: number;
    lastWorkoutName: string | null;
    currentStreak: number;
    nextWorkoutName: string | null;
};