import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { getWorkoutSummary } from "../services/historyService";
import { colors, spacing, typography } from "../theme";

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
            <Text style={styles.title}>
                Workout Complete 🎉
            </Text>

            <Text style={styles.subtitle}>
                {routineName}
            </Text>

            <Card style={styles.heroCard}>
                <Text style={styles.heroValue}>
                    {summary?.totalVolume ?? 0} kg
                </Text>

                <Text style={styles.heroLabel}>
                    Total Volume
                </Text>
            </Card>

            <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                    <Text style={styles.label}>Duration</Text>
                    <Text style={styles.value}>
                        {summary?.durationMinutes ?? 0} min
                    </Text>
                </Card>

                <Card style={styles.statCard}>
                    <Text style={styles.label}>Sets</Text>
                    <Text style={styles.value}>
                        {summary?.totalSets ?? 0}
                    </Text>
                </Card>
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
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 8,
        marginBottom: 24,
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
    statCard: {
        flex: 1,
    },
    label: {
        color: colors.textSecondary,
        fontSize: typography.caption,
    },
    value: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightExtraBold,
        marginTop: spacing.xs,
    },
});
