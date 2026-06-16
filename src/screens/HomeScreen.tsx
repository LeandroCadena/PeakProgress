import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

type DashboardStats = {
    routinesCount: number;
    completedWorkouts: number;
    totalSets: number;
    lastWorkoutName: string | null;
    currentStreak: number;
    nextWorkoutName: string | null;
};

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();

    const [stats, setStats] = useState<DashboardStats>({
        routinesCount: 0,
        completedWorkouts: 0,
        totalSets: 0,
        lastWorkoutName: null,
        currentStreak: 0,
        nextWorkoutName: null,
    });

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
        }, [user?.id])
    );

    async function fetchDashboardStats() {
        if (!user?.id) return;

        const { count: routinesCount, error: routinesError } = await supabase
            .from("routines")
            .select("*", { count: "exact", head: true });

        if (routinesError) {
            Alert.alert("Error", routinesError.message);
            return;
        }

        const { count: completedWorkouts, error: workoutsError } = await supabase
            .from("workout_sessions")
            .select("*", { count: "exact", head: true })
            .not("completed_at", "is", null);

        if (workoutsError) {
            Alert.alert("Error", workoutsError.message);
            return;
        }

        const { count: totalSets, error: setsError } = await supabase
            .from("workout_sets")
            .select("*", { count: "exact", head: true });

        if (setsError) {
            Alert.alert("Error", setsError.message);
            return;
        }

        const { data: lastWorkout, error: lastWorkoutError } = await supabase
            .from("workout_sessions")
            .select(`
        id,
        started_at,
        routines (
          name
        )
      `)
            .not("completed_at", "is", null)
            .order("started_at", { ascending: false })
            .limit(1)
            .single();

        if (lastWorkoutError && lastWorkoutError.code !== "PGRST116") {
            Alert.alert("Error", lastWorkoutError.message);
            return;
        }

        const { data: completedSessions, error: streakError } = await supabase
            .from("workout_sessions")
            .select("completed_at")
            .not("completed_at", "is", null);

        if (streakError) {
            Alert.alert("Error", streakError.message);
            return;
        }

        const { data: routinesData, error: routinesListError } = await supabase
            .from("routines")
            .select("id, name")
            .order("created_at", { ascending: false });

        if (routinesListError) {
            Alert.alert("Error", routinesListError.message);
            return;
        }

        const lastWorkoutName =
            (lastWorkout?.routines as any)?.[0]?.name ?? null;

        const nextWorkout =
            routinesData?.find((routine) => routine.name !== lastWorkoutName) ??
            routinesData?.[0] ??
            null;

        setStats({
            routinesCount: routinesCount ?? 0,
            completedWorkouts: completedWorkouts ?? 0,
            totalSets: totalSets ?? 0,
            lastWorkoutName,
            currentStreak: calculateWorkoutStreak(
                completedSessions?.map((session) => session.completed_at) ?? []
            ),
            nextWorkoutName: nextWorkout?.name ?? null,
        });
    }

    function calculateWorkoutStreak(dates: string[]) {
        if (!dates.length) return 0;

        const uniqueDays = Array.from(
            new Set(
                dates.map((date) => new Date(date).toISOString().split("T")[0])
            )
        ).sort((a, b) => (a > b ? -1 : 1));

        let streak = 0;
        const today = new Date();

        for (let i = 0; i < uniqueDays.length; i++) {
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            const expectedDay = expectedDate.toISOString().split("T")[0];

            if (uniqueDays.includes(expectedDay)) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>PeakProgress</Text>
            <Text style={styles.subtitle}>Welcome back, {user?.email}</Text>

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
                    <Text style={styles.cardValue}>{stats.totalSets}</Text>
                    <Text style={styles.cardLabel}>Sets</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardValue}>
                        {stats.lastWorkoutName ?? "-"}
                    </Text>
                    <Text style={styles.cardLabel}>Last Workout</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardValue}>🔥 {stats.currentStreak}</Text>
                    <Text style={styles.cardLabel}>Day Streak</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardValue}>{stats.nextWorkoutName ?? "-"}</Text>
                    <Text style={styles.cardLabel}>Next Workout</Text>
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