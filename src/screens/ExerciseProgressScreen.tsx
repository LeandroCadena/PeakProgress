import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Text, StyleSheet, Dimensions, Alert } from "react-native";
import { LineChart } from "react-native-chart-kit";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import SectionTitle from "../components/common/SectionTitle";
import { getExerciseProgressPoints } from "../services/progressService";
import { colors, componentStyles, spacing, typography } from "../theme";

type RouteParams = {
    ExerciseProgress: {
        exerciseId: string;
        exerciseName: string;
    };
};

type ProgressPoint = {
    weight: number | null;
    reps: number;
    created_at: string;
};

export default function ExerciseProgressScreen() {
    const route = useRoute<RouteProp<RouteParams, "ExerciseProgress">>();
    const { exerciseId, exerciseName } = route.params;

    const [points, setPoints] = useState<ProgressPoint[]>([]);

    const fetchExerciseProgress = useCallback(async () => {
        try {
            const data = await getExerciseProgressPoints(exerciseId);
            setPoints(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [exerciseId]);

    useEffect(() => {
        fetchExerciseProgress();
    }, [fetchExerciseProgress]);

    const chartData = points.length
        ? {
            labels: points.map((_, index) => `${index + 1}`),
            datasets: [
                {
                    data: points.map((point) => Number(point.weight ?? 0)),
                },
            ],
        }
        : {
            labels: ["0"],
            datasets: [{ data: [0] }],
        };

    return (
        <ScreenContainer>
            <Text style={styles.title}>{exerciseName}</Text>

            <Text style={styles.subtitle}>
                Track your strength progression.
            </Text>

            <SectionTitle>Weight Progression</SectionTitle>

            {points.length === 0 ? (
                <EmptyStateCard
                    title="No progress yet"
                    message="Complete a workout with this exercise to start tracking progress."
                />
            ) : (
                <Card>
                    <LineChart
                        data={chartData}
                        width={Dimensions.get("window").width - 48}
                        height={240}
                        yAxisSuffix="kg"
                        chartConfig={{
                            backgroundColor: "#161B22",
                            backgroundGradientFrom: "#161B22",
                            backgroundGradientTo: "#161B22",
                            decimalPlaces: 0,
                            color: () => "#4CAF50",
                            labelColor: () => "#9CA3AF",
                        }}
                        bezier
                        style={styles.chart}
                    />
                </Card>
            )}

            <Text style={styles.info}>
                Each point represents one completed set.
            </Text>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
    },

    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        marginTop: spacing.xs,
        marginBottom: spacing.xl,
    },

    chart: {
        borderRadius: componentStyles.cardRadius,
    },

    info: {
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
});
