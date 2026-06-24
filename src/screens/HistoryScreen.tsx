import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { getCompletedWorkoutSessions } from "../services/historyService";
import { colors, sharedStyles, spacing } from "../theme";

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

    async function fetchSessions() {
        try {
            const data = await getCompletedWorkoutSessions();
            setSessions(data as WorkoutSession[]);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchSessions();
        }, [])
    );

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
            <Text style={sharedStyles.screenTitle}>Workout History</Text>

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyStateCard
                        title="No completed workouts yet"
                        message="Finish your first workout to see it here."
                    />
                }
                renderItem={({ item }) => {
                    const routineName =
                        item.routine_name_snapshot ?? item.routines?.[0]?.name ?? "Routine";

                    return (
                        <Pressable
                            onPress={() =>
                                navigation.navigate("WorkoutDetail", {
                                    sessionId: item.id,
                                    routineName,
                                })
                            }
                        >
                            <Card style={styles.card}>
                                <Text style={sharedStyles.cardTitle}>{routineName}</Text>
                                <Text style={styles.cardText}>
                                    Sets: {item.total_sets ?? 0} · Volume:{" "}
                                    {Number(item.total_volume ?? 0)} kg
                                </Text>
                                <Text style={styles.cardText}>{formatDate(item.started_at)}</Text>
                                <Text style={styles.cardText}>
                                    Duration: {getDuration(item.started_at, item.completed_at)}
                                </Text>
                            </Card>
                        </Pressable>
                    );
                }}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: spacing.md,
        paddingBottom: spacing.xxl,
    },
    card: {
        gap: spacing.xs,
    },
    cardText: {
        color: colors.textSecondary,
    },
});
