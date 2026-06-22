import { useCallback, useState } from "react";
import {
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getCompletedWorkoutSessions } from "../services/historyService";
import ScreenContainer from "../components/common/ScreenContainer";

type WorkoutSession = {
    routine_name_snapshot: string;
    id: string;
    started_at: string;
    completed_at: string | null;
    total_volume: number;
    total_sets: number;
    routines: {
        name: string;
    }[];
};

export default function HistoryScreen({ navigation }: any) {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);

    useFocusEffect(
        useCallback(() => {
            fetchSessions();
        }, [])
    );

    async function fetchSessions() {
        try {
            const data = await getCompletedWorkoutSessions();
            setSessions(data as WorkoutSession[]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function formatDate(value: string) {
        return new Date(value).toLocaleDateString();
    }

    function getDuration(startedAt: string, completedAt: string | null) {
        if (!completedAt) return "Not completed";

        const start = new Date(startedAt).getTime();
        const end = new Date(completedAt).getTime();
        const minutes = Math.max(1, Math.round((end - start) / 60000));

        return `${minutes} min`;
    }

    return (
        <ScreenContainer>
            <Text style={styles.title}>Workout History</Text>

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No completed workouts yet.</Text>
                }
                renderItem={({ item }) => {
                    const routineName =
                        item.routine_name_snapshot ??
                        item.routines?.[0]?.name ??
                        "Routine";

                    return (
                        <Pressable
                            style={styles.card}
                            onPress={() =>
                                navigation.navigate("WorkoutDetail", {
                                    sessionId: item.id,
                                    routineName,
                                })
                            }
                        >
                            <Text style={styles.cardTitle}>{routineName}</Text>
                            <Text style={styles.cardText}>
                                Sets: {item.total_sets ?? 0} · Volume: {Number(item.total_volume ?? 0)} kg
                            </Text>
                            <Text style={styles.cardText}>{formatDate(item.started_at)}</Text>
                            <Text style={styles.cardText}>
                                Duration: {getDuration(item.started_at, item.completed_at)}
                            </Text>
                        </Pressable>
                    );
                }}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 24,
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