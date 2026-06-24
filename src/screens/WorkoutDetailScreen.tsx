import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Text, StyleSheet, FlatList, Alert } from "react-native";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { getWorkoutSets } from "../services/historyService";
import { colors, sharedStyles, spacing, typography } from "../theme";

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
        <ScreenContainer style={styles.container}>
            <Text style={sharedStyles.screenTitle}>{routineName}</Text>
            <Text style={sharedStyles.screenSubtitle}>Workout Details</Text>

            <FlatList
                data={sets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyStateCard
                        title="No sets saved"
                        message="This workout does not have saved sets."
                    />
                }
                renderItem={({ item, index }) => (
                    <Card style={styles.card}>
                        <Text style={sharedStyles.cardTitle}>
                            {item.exercise_name_snapshot ?? "Exercise"}
                        </Text>

                        <Text style={sharedStyles.mutedText}>
                            Set {index + 1}: {item.weight ?? 0} kg × {item.reps ?? 0} reps
                        </Text>

                        <Text
                            style={[
                                styles.statusText,
                                item.is_completed ? styles.completedText : styles.skippedText,
                            ]}
                        >
                            {item.is_completed ? "Completed" : "Skipped"}
                        </Text>
                    </Card>
                )}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 0,
    },
    list: {
        gap: spacing.md,
        paddingBottom: spacing.xxl,
    },
    card: {
        gap: spacing.xs,
    },
    statusText: {
        fontSize: typography.caption,
        fontWeight: typography.weightBold,
    },
    completedText: {
        color: colors.success,
    },
    skippedText: {
        color: colors.warning,
    },
});
