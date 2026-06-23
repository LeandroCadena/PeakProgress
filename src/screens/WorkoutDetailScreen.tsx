import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";

import { getWorkoutSets } from "../services/historyService";

type RouteParams = {
    WorkoutDetail: {
        sessionId: string;
        routineName: string;
    };
};

export type WorkoutSet = {
    id: string;
    exercise_id?: string | null;
    exercise_name_snapshot?: string | null;
    reps: number;
    weight: number | null;
    is_completed: boolean;
};

export default function WorkoutDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, "WorkoutDetail">>();
    const { sessionId, routineName } = route.params;

    const [sets, setSets] = useState<WorkoutSet[]>([]);

    const fetchSets = useCallback(async () => {
        try {
            const data = await getWorkoutSets(sessionId);
            setSets(data as WorkoutSet[]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSets();
    }, [fetchSets]);

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
                    return (
                        <View style={styles.card}>
                            <Text style={styles.exerciseName}>
                                {item.exercise_name_snapshot ?? "Exercise"}
                            </Text>

                            <Text style={styles.setText}>
                                {sets.map((set, index) => (
                                    <Text key={index}>
                                        Set {index + 1}: {item.weight ?? 0} kg x {item.reps ?? 0}{" "}
                                        reps{"\n"}
                                    </Text>
                                ))}
                            </Text>

                            <Text
                                style={[
                                    styles.statusText,
                                    item.is_completed ? styles.completedText : styles.skippedText,
                                ]}
                            >
                                {item.is_completed ? "Completed" : "Skipped"}
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
    completedText: {
        color: "#4CAF50",
        fontWeight: "700",
    },

    skippedText: {
        color: "#F59E0B",
        fontWeight: "700",
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 6,
    },

    setText: {
        fontSize: 14,
        color: "#D1D5DB",
        marginBottom: 4,
    },

    statusText: {
        fontSize: 13,
        fontWeight: "700",
        marginTop: 4,
    },
});
