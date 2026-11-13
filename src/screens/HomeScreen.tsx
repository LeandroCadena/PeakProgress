import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import AppButton from "../components/common/AppButton";
import ScreenContainer from "../components/common/ScreenContainer";
import StatCard from "../components/common/StatCard";
import RoutineCard from "../components/routine/RoutineCard";
import ActiveWorkoutBanner from "../components/workout/ActiveWorkoutBanner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useProfile } from "../hooks/useProfile";
import { useLanguage } from "../i18n/LanguageProvider";
import { getDashboardStats, getRecentWorkouts } from "../services/dashboardService";
import { getActiveWorkoutSession } from "../services/workoutService";
import { useWorkoutSessionStore } from "../store/workoutSessionStore";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";
import { DashboardStats, RecentWorkout } from "../types/dashboard";

export default function HomeScreen({ navigation }: any) {
    const { locale, t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { user } = useAuth();
    const { showToast } = useToast();
    const { fullName } = useProfile();
    const [activeSession, setActiveSession] = useState<any>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
    const [now, setNow] = useState(() => Date.now());

    const [stats, setStats] = useState<DashboardStats>({
        routinesCount: 0,
        completedWorkouts: 0,
        lastWorkoutName: null,
        streakWeeks: 0,
        streakWorkouts: 0,
        streakStatus: "empty",
        streakDaysRemaining: null,
    });

    const localSessionId = useWorkoutSessionStore((state) => state.sessionId);
    const localRestTimerEndAt = useWorkoutSessionStore((state) => state.restTimerEndAt);

    const activeRestTimerEndAt =
        activeSession?.id === localSessionId
            ? localRestTimerEndAt
            : activeSession?.rest_timer_end_at;

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchDashboardStats = useCallback(async () => {
        if (!user?.id) return;

        try {
            const dashboardStats = await getDashboardStats(user.id);
            setStats(dashboardStats);

            const recent = await getRecentWorkouts(user.id);
            setRecentWorkouts(recent);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to load dashboard stats.",
            });
        }
    }, [user, showToast]);

    const fetchActiveSession = useCallback(async () => {
        if (!user) return;

        try {
            const data = await getActiveWorkoutSession(user.id);
            setActiveSession(data);
        } catch (error) {
            console.log("Active workout error:", error);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
            fetchActiveSession();
        }, [fetchDashboardStats, fetchActiveSession])
    );

    function getElapsedText(startedAt: string) {
        const diffMs = now - new Date(startedAt).getTime();
        const minutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;

        if (hours > 0) return `${hours}h ${restMinutes}m`;
        return `${minutes}m`;
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
        return new Date(date).toLocaleDateString(locale, {
            month: "short",
            day: "numeric",
        });
    }

    function getWorkoutDuration(startedAt: string, completedAt: string) {
        const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

        const minutes = Math.max(0, Math.floor(diffMs / 60000));
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;

        if (hours > 0) return `${hours}h ${restMinutes}m`;
        return `${minutes}m`;
    }

    function getWorkoutSubtitle(startedAt: string, completedAt: string, count: number) {
        const date = formatWorkoutDate(completedAt);

        const duration = getWorkoutDuration(startedAt, completedAt);

        const exerciseCount = t(count === 1 ? "oneExerciseCount" : "manyExerciseCount").replace(
            "{count}",
            String(count)
        );
        return `${date} · ${duration} · ${exerciseCount}`;
    }

    return (
        <ScreenContainer scroll>
            <Text style={sharedStyles.screenTitle}>{t("home")}</Text>

            {activeSession ? (
                <ActiveWorkoutBanner
                    routineName={activeSession.routines?.name ?? t("workout")}
                    elapsedText={getElapsedText(activeSession.started_at)}
                    restRemainingText={getRestRemainingText(activeRestTimerEndAt)}
                    onPress={() =>
                        navigation.navigate("WorkoutSession", {
                            sessionId: activeSession.id,
                            routineId: activeSession.routine_id,
                            routineName: activeSession.routines?.name ?? t("workout"),
                        })
                    }
                />
            ) : null}
            <Text style={sharedStyles.mutedText}>{t("homeGreeting")}</Text>

            <Text style={sharedStyles.sectionTitle}>
                {fullName?.trim() ? `${fullName.trim()} 👋` : `${t("athlete")} 👋`}
            </Text>

            <View style={styles.heroSection}>
                <Text style={styles.heroText}>
                    {t("homeHeroLead")}
                    {"\n"}
                    <Text style={styles.heroHighlight}>{t("homeHeroAccent")}</Text>
                    <Text>{t("homeHeroTail")}</Text>
                </Text>

                <Image
                    source={require("../../assets/gym-time-logo.png")}
                    style={styles.heroLogo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.statsRow}>
                <StatCard
                    value={stats.completedWorkouts}
                    label={t("workouts")}
                    helper={t("workoutsCompleted")}
                />

                <StatCard
                    value={stats.streakWorkouts}
                    label={t("last14Days")}
                    helper={
                        stats.streakStatus === "empty"
                            ? t("startToday")
                            : stats.streakStatus === "warning"
                              ? t("keepItUp")
                              : stats.streakStatus === "expired"
                                ? t("startAgain")
                                : t(stats.streakWeeks === 1 ? "activeWeek" : "activeWeeks").replace(
                                      "{count}",
                                      String(stats.streakWeeks)
                                  )
                    }
                />
            </View>

            <AppButton
                title={t("startWorkout")}
                variant="primary"
                onPress={() => navigation.navigate("Routines")}
                iconLeft={<Ionicons name="barbell-outline" size={22} color={colors.text} />}
                showChevron
            />

            {recentWorkouts.length > 0 ? (
                <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={sharedStyles.sectionTitle}>{t("recentWorkouts")}</Text>
                        <View style={styles.sectionButton}>
                            <Pressable onPress={() => navigation.navigate("History")}>
                                <Text style={styles.sectionAction}>{t("viewAll")}</Text>
                            </Pressable>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                        </View>
                    </View>

                    {recentWorkouts.map((workout) => (
                        <RoutineCard
                            key={workout.id}
                            title={workout.routine_name_snapshot ?? t("workout")}
                            subtitle={getWorkoutSubtitle(
                                workout.started_at,
                                workout.completed_at,
                                workout.workout_session_exercises?.length ?? 0
                            )}
                        />
                    ))}
                </View>
            ) : null}
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
    heroText: {
        color: colors.text,
        fontSize: 30,
        fontWeight: typography.weightBold,
        lineHeight: spacing.xxl,
    },
    heroHighlight: {
        color: colors.success,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    recentSection: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
    },
    sectionAction: {
        color: colors.primary,
        fontWeight: typography.weightBold,
        fontSize: typography.caption,
    },
    sectionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    heroSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    heroLogo: {
        width: 120,
        height: 120,
        marginLeft: spacing.md,
    },
    chevron: {
        position: "absolute",
        right: spacing.md,
    },
}));
