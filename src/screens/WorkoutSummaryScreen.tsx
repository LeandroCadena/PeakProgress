import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import StatCard from "../components/common/StatCard";
import { getWorkoutSummary } from "../services/historyService";
import { colors, sharedStyles, spacing, typography } from "../theme";

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

            <AppButton
                title="Back to Home"
                variant="primary"
                onPress={() => navigation.navigate("Main")}
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
});
