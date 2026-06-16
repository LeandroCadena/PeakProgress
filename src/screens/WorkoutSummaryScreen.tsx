import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";

type RouteParams = {
    WorkoutSummary: {
        sessionId: string;
        routineName: string;
    };
};

type Summary = {
    durationMinutes: number;
    totalSets: number;
    totalVolume: number;
};

export default function WorkoutSummaryScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "WorkoutSummary">>();
    const { sessionId, routineName } = route.params;

    const [summary, setSummary] = useState<Summary | null>(null);

    async function fetchSummary() {
        const { data: session, error: sessionError } = await supabase
            .from("workout_sessions")
            .select("started_at, completed_at")
            .eq("id", sessionId)
            .single();

        if (sessionError) {
            Alert.alert("Error", sessionError.message);
            return;
        }

        const { data: sets, error: setsError } = await supabase
            .from("workout_sets")
            .select("reps, weight")
            .eq("workout_session_id", sessionId);

        if (setsError) {
            Alert.alert("Error", setsError.message);
            return;
        }

        const totalSets = sets?.length ?? 0;

        const totalVolume =
            sets?.reduce((sum, set) => {
                return sum + Number(set.weight ?? 0) * Number(set.reps ?? 0);
            }, 0) ?? 0;

        const start = new Date(session.started_at).getTime();
        const end = new Date(session.completed_at ?? new Date()).getTime();

        setSummary({
            durationMinutes: Math.max(1, Math.round((end - start) / 60000)),
            totalSets,
            totalVolume,
        });
    }

    useEffect(() => {
        fetchSummary();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout Complete 🎉</Text>
            <Text style={styles.subtitle}>{routineName}</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Duration</Text>
                <Text style={styles.value}>{summary?.durationMinutes ?? 0} min</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Total Sets</Text>
                <Text style={styles.value}>{summary?.totalSets ?? 0}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Total Volume</Text>
                <Text style={styles.value}>{summary?.totalVolume ?? 0} kg</Text>
            </View>

            <Pressable
                style={styles.button}
                onPress={() => navigation.navigate("Main")}
            >
                <Text style={styles.buttonText}>Back to Home</Text>
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
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 8,
        marginBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#30363D",
        marginBottom: 14,
    },
    label: {
        color: "#9CA3AF",
        fontSize: 14,
    },
    value: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
        marginTop: 6,
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },
});