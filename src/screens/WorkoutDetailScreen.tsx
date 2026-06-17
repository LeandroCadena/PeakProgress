import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { getWorkoutSets } from "../services/historyService";

type RouteParams = {
    WorkoutDetail: {
        sessionId: string;
        routineName: string;
    };
};

type WorkoutSet = {
    exercise_name_snapshot: string;
    id: string;
    set_number: number;
    reps: number;
    weight: number | null;
    exercises: {
        name: string;
    }[];
};

export default function WorkoutDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, "WorkoutDetail">>();
    const { sessionId, routineName } = route.params;

    const [sets, setSets] = useState<WorkoutSet[]>([]);

    useEffect(() => {
        fetchSets();
    }, []);

    async function fetchSets() {
        try {
            const data = await getWorkoutSets(sessionId);
            setSets(data as WorkoutSet[]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineName}</Text>
            <Text style={styles.subtitle}>Workout Details</Text>

            <FlatList
                data={sets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No sets saved for this workout.</Text>
                }
                renderItem={({ item }) => {
                    const exerciseName =
                        item.exercise_name_snapshot ??
                        item.exercises?.[0]?.name ??
                        "Exercise";

                    return (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{exerciseName}</Text>
                            <Text style={styles.cardText}>
                                Set {item.set_number}: {item.weight ?? 0} kg x {item.reps} reps
                            </Text>
                        </View>
                    );
                }}
            />
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
        marginTop: 6,
        marginBottom: 20,
    },
    list: {
        gap: 12,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    emptyText: {
        color: "#9CA3AF",
    },
});