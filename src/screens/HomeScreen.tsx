import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { DashboardStats } from "../types/dashboard";
import { getDashboardStats, getRecentWorkouts } from "../services/dashboardService";
import { getActiveWorkoutSession } from "../services/workoutService";
import { RecentWorkout } from "../types/dashboard";
import { useProfile } from "../hooks/useProfile";
import { colors, spacing, typography } from "../theme";
import ActiveWorkoutBanner from "../components/workout/ActiveWorkoutBanner";
import ScreenContainer from "../components/common/ScreenContainer";
import Card from "../components/common/Card";
import AppButton from "../components/common/AppButton";

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const { fullName } = useProfile();
    const [activeSession, setActiveSession] = useState<any>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
    const [now, setNow] = useState(Date.now());

    const [stats, setStats] = useState<DashboardStats>({
        routinesCount: 0,
        completedWorkouts: 0,
        lastWorkoutName: null,
        streakWeeks: 0,
        streakWorkouts: 0,
        streakStatus: "empty",
        streakDaysRemaining: null,
    });

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
            fetchActiveSession();
        }, [user?.id])
    );

    async function fetchDashboardStats() {
        if (!user?.id) return;

        try {
            const dashboardStats = await getDashboardStats(user.id);
            setStats(dashboardStats);

            const recent = await getRecentWorkouts(user.id);
            setRecentWorkouts(recent);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function getElapsedText(startedAt: string) {
        const diffMs = Date.now() - new Date(startedAt).getTime();
        const minutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;

        if (hours > 0) return `${hours}h ${restMinutes}m`;
        return `${minutes}m`;
    }

    async function fetchActiveSession() {
        if (!user) return;

        try {
            const data = await getActiveWorkoutSession(user.id);
            setActiveSession(data);
        } catch (error) {
            console.log("Active workout error:", error);
        }
    }

    function getRestRemainingText(restTimerEndAt?: string | null) {
        if (!restTimerEndAt) return undefined;

        const remainingSeconds = Math.max(
            0,
            Math.ceil((new Date(restTimerEndAt).getTime() - now) / 1000)
        );

        if (remainingSeconds <= 0) return undefined;

        return `${remainingSeconds}s`;
    }

    function formatWorkoutDate(date: string) {
        return new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    }

    function getWorkoutDuration(startedAt: string, completedAt: string) {
        const diffMs =
            new Date(completedAt).getTime() -
            new Date(startedAt).getTime();

        const minutes = Math.max(0, Math.floor(diffMs / 60000));
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;

        if (hours > 0) return `${hours}h ${restMinutes}m`;
        return `${minutes}m`;
    }

    return (
        <ScreenContainer>
            {activeSession ? (
                <ActiveWorkoutBanner
                    routineName={activeSession.routines?.name ?? "Workout"}
                    elapsedText={getElapsedText(activeSession.started_at)}
                    restRemainingText={getRestRemainingText(activeSession.rest_timer_end_at)}
                    onPress={() =>
                        navigation.navigate("WorkoutSession", {
                            sessionId: activeSession.id,
                            routineId: activeSession.routine_id,
                            routineName: activeSession.routines?.name ?? "Workout",
                        })
                    }
                />
            ) : null}
            <Text style={styles.greeting}>Good to see you,</Text>

            <Text style={styles.name}>
                {fullName?.trim() ? `${fullName.trim()} 👋` : "Athlete 👋"}
            </Text>

            <Text style={styles.heroText}>
                Let&apos;s get{"\n"}
                <Text style={styles.heroHighlight}>stronger</Text>
                {"\n"}today.
            </Text>

            <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.completedWorkouts}</Text>
                    <Text style={styles.statTitle}>Workouts</Text>
                    <Text style={styles.statSubtitle}>Completed</Text>
                </Card>

                <Card style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.streakWorkouts}</Text>
                    <Text style={styles.statTitle}>Last 14 Days</Text>
                    <Text style={styles.statSubtitle}>
                        {stats.streakStatus === "empty"
                            ? "Start today"
                            : stats.streakStatus === "warning"
                                ? "Keep it up"
                                : stats.streakStatus === "expired"
                                    ? "Start again"
                                    : `${stats.streakWeeks} active weeks`}
                    </Text>
                </Card>
            </View>

            <AppButton
                title="Start Workout"
                variant="primary"
                onPress={() => navigation.navigate("Routines")}
                style={styles.startButton}
            />

            {recentWorkouts.length > 0 ? (
                <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Workouts</Text>
                        <Text style={styles.sectionAction}>View All</Text>
                    </View>

                    {recentWorkouts.map((workout) => (
                        <Card key={workout.id} style={styles.recentCard}>
                            <View>
                                <Text style={styles.recentTitle}>
                                    {workout.routine_name_snapshot ?? "Workout"}
                                </Text>

                                <Text style={styles.recentMeta}>
                                    {formatWorkoutDate(workout.completed_at)} ·{" "}
                                    {getWorkoutDuration(
                                        workout.started_at,
                                        workout.completed_at
                                    )}{" "}
                                    · {workout.workout_session_exercises?.length ?? 0} exercises
                                </Text>
                            </View>
                        </Card>
                    ))}
                </View>
            ) : null}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    greeting: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginBottom: spacing.xs,
    },
    name: {
        color: colors.text,
        fontSize: 24,
        fontWeight: "800",
        marginBottom: spacing.lg,
    },
    heroText: {
        color: colors.text,
        fontSize: 46,
        fontWeight: "900",
        lineHeight: 52,
        marginBottom: spacing.xl,
        letterSpacing: -1,
    },
    heroHighlight: {
        color: colors.primary,
    },
    startButton: {
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
    },
    statValue: {
        color: colors.text,
        fontSize: 32,
        fontWeight: "900",
    },
    statTitle: {
        color: colors.text,
        fontWeight: "800",
        marginTop: spacing.xs,
    },
    statSubtitle: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontSize: typography.caption,
    },
    recentSection: {
        marginTop: spacing.lg,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },

    sectionTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
    },

    sectionAction: {
        color: colors.primary,
        fontWeight: "800",
    },

    recentCard: {
        marginBottom: spacing.md,
    },

    recentTitle: {
        color: colors.text,
        fontWeight: "800",
        fontSize: typography.body,
    },

    recentMeta: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});