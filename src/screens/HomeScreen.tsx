import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
    getDashboardStats,
} from "../services/dashboardService";
import { DashboardStats } from "../types/dashboard";
import { getActiveWorkoutSession } from "../services/workoutService";
import ActiveWorkoutBanner from "../components/workout/ActiveWorkoutBanner";
import { useProfile } from "../hooks/useProfile";

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const { fullName } = useProfile();
    const [activeSession, setActiveSession] = useState<any>(null);
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

    return (
        <View style={styles.container}>
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
            <Text style={styles.title}>PeakProgress</Text>
            <Text style={styles.subtitle}>
                {fullName?.trim()
                    ? `Welcome back, ${fullName.trim()} 👋`
                    : `Welcome back, ${user?.email}`}
            </Text>

            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardValue}>{stats.routinesCount}</Text>
                    <Text style={styles.cardLabel}>Routines</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardValue}>{stats.completedWorkouts}</Text>
                    <Text style={styles.cardLabel}>Workouts</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardValue}>
                        {stats.lastWorkoutName ?? "-"}
                    </Text>
                    <Text style={styles.cardLabel}>Last Workout</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardValue}>🔥 {stats.streakWorkouts}</Text>

                    <Text style={styles.cardLabel}>
                        {stats.streakStatus === "empty"
                            ? "Start your first workout! 💪"
                            : stats.streakStatus === "warning"
                                ? "Train this week to keep your streak alive! ⚡"
                                : stats.streakStatus === "expired"
                                    ? "Your streak expired. Start again today! 🔥"
                                    : `${stats.streakWorkouts} workouts in ${stats.streakWeeks} weeks`}
                    </Text>
                </View>
            </View>

            <Pressable
                style={styles.button}
                onPress={() => navigation.navigate("Routines")}
            >
                <Text style={styles.buttonText}>Start Training</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 34,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 8,
        marginBottom: 28,
    },
    grid: {
        gap: 14,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardValue: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "800",
    },
    cardLabel: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 28,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },
});