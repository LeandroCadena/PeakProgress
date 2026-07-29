import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import StatCard from "../components/common/StatCard";
import { getWorkoutSummary } from "../services/historyService";
import { updateRoutineFromCompletedWorkout } from "../services/workoutSyncService";
import { colors, sharedStyles, spacing, typography } from "../theme";

type RouteParams = {
    WorkoutSummary: {
        sessionId: string;
        routineId: string;
        routineName: string;
        updateRoutineAfterWorkout: boolean;
    };
};

type Summary = {
    durationMinutes: number;
    totalSets: number;
    totalVolume: number;
};

export default function WorkoutSummaryScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "WorkoutSummary">>();
    const { sessionId, routineId, routineName, updateRoutineAfterWorkout } = route.params;

    const [summary, setSummary] = useState<Summary | null>(null);
    const [routineUpdateStatus, setRoutineUpdateStatus] = useState<
        "idle" | "updating" | "success" | "error"
    >("idle");

    const hasAttemptedRoutineUpdateRef = useRef(false);

    const fetchSummary = useCallback(async () => {
        try {
            const data = await getWorkoutSummary(sessionId);
            setSummary(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        if (!summary || !updateRoutineAfterWorkout || hasAttemptedRoutineUpdateRef.current) {
            return;
        }

        hasAttemptedRoutineUpdateRef.current = true;

        async function updateRoutine() {
            setRoutineUpdateStatus("updating");

            try {
                await updateRoutineFromCompletedWorkout({
                    sessionId,
                    routineId,
                });

                setRoutineUpdateStatus("success");
            } catch (error) {
                console.log("Automatic routine update failed", error);

                setRoutineUpdateStatus("error");
            }
        }

        updateRoutine();
    }, [routineId, sessionId, summary, updateRoutineAfterWorkout]);

    return (
        <ScreenContainer>
            <Text style={styles.title}>Workout Complete 🎉</Text>

            <Text style={sharedStyles.screenTitle}>{routineName}</Text>

            <Card style={styles.heroCard}>
                <Text style={styles.heroValue}>{summary?.totalVolume ?? 0} kg</Text>

                <Text style={styles.heroLabel}>Total Volume</Text>
            </Card>

            <View style={styles.statsRow}>
                <StatCard label="Duration" value={`${summary?.durationMinutes ?? 0} min`} />

                <StatCard label="Sets" value={summary?.totalSets ?? 0} />
            </View>

            {routineUpdateStatus === "updating" ? (
                <Text style={styles.syncText}>Updating routine...</Text>
            ) : null}

            {routineUpdateStatus === "success" ? (
                <Text style={styles.syncText}>Routine updated</Text>
            ) : null}

            {routineUpdateStatus === "error" ? (
                <Text style={styles.syncErrorText}>
                    Workout saved, but the routine could not be updated.
                </Text>
            ) : null}

            <AppButton
                title="Back to Home"
                variant="primary"
                onPress={() => navigation.navigate("Main")}
                iconLeft={<Ionicons name="barbell-outline" size={22} color={colors.text} />}
                showChevron
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: 30,
        fontWeight: "800",
    },
    heroCard: {
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    heroValue: {
        color: colors.success,
        fontSize: 40,
        fontWeight: typography.weightExtraBold,
    },
    heroLabel: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    syncText: {
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: 8,
    },
    syncErrorText: {
        color: colors.danger,
        textAlign: "center",
        marginTop: 8,
    },
});
