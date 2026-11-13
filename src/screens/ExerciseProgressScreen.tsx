import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { localizedExerciseName } from "../i18n/exerciseText";
import { useLanguage } from "../i18n/LanguageProvider";
import { getExerciseProgressPoints } from "../services/progressService";
import { componentStyles, spacing, typography, useAppTheme, createThemedStyles } from "../theme";

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
    const { language, locale, t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { user } = useAuth();
    const { showToast } = useToast();
    const route = useRoute<RouteProp<RouteParams, "ExerciseProgress">>();
    const { exerciseId, exerciseName } = route.params;

    const [points, setPoints] = useState<ProgressPoint[]>([]);

    const fetchExerciseProgress = useCallback(async () => {
        try {
            const data = await getExerciseProgressPoints(exerciseId, user.id);
            setPoints(data);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("exerciseProgressError"),
            });
        }
    }, [exerciseId, showToast, t, user.id]);

    useEffect(() => {
        fetchExerciseProgress();
    }, [fetchExerciseProgress]);

    const chartData = points.length
        ? {
              labels: points.map((_, index) => (index + 1).toLocaleString(locale)),
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
            <Text style={styles.title}>
                {localizedExerciseName(exerciseId, exerciseName, language)}
            </Text>

            <Text style={sharedStyles.screenSubtitle}>{t("strengthProgress")}</Text>

            <Text style={sharedStyles.screenTitle}>{t("weightProgression")}</Text>

            {points.length === 0 ? (
                <EmptyStateCard title={t("noProgress")} message={t("firstExerciseProgress")} />
            ) : (
                <Card>
                    <LineChart
                        data={chartData}
                        width={Dimensions.get("window").width - 48}
                        height={240}
                        yAxisSuffix=" kg"
                        formatYLabel={(value) => Number(value).toLocaleString(locale)}
                        chartConfig={{
                            backgroundColor: colors.card,
                            backgroundGradientFrom: colors.card,
                            backgroundGradientTo: colors.card,
                            decimalPlaces: 0,
                            color: () => colors.success,
                            labelColor: () => colors.textSecondary,
                        }}
                        bezier
                        style={styles.chart}
                    />
                </Card>
            )}

            <Text style={styles.info}>{t("chartPointDescription")}</Text>
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
    },
    chart: {
        borderRadius: componentStyles.cardRadius,
    },
    info: {
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
}));
