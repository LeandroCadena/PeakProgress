import { useLanguage } from "../i18n/LanguageProvider";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text } from "react-native";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { useToast } from "../context/ToastContext";
import { getWorkoutSets } from "../services/historyService";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

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
    const { locale, t } = useLanguage();
    const formatNumber = new Intl.NumberFormat(locale);
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const route = useRoute<RouteProp<RouteParams, "WorkoutDetail">>();
    const { sessionId, routineName } = route.params;
    const { showToast } = useToast();
    const [sets, setSets] = useState<WorkoutSet[]>([]);

    const fetchSets = useCallback(async () => {
        try {
            const data = await getWorkoutSets(sessionId);
            setSets(data as WorkoutSet[]);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("workoutSetsError"),
            });
        }
    }, [sessionId, showToast]);

    useEffect(() => {
        fetchSets();
    }, [fetchSets]);

    return (
        <ScreenContainer style={styles.container}>
            <Text style={sharedStyles.screenTitle}>{routineName}</Text>
            <Text style={sharedStyles.screenSubtitle}>{t("workoutDetails")}</Text>

            <FlatList
                data={sets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyStateCard title={t("noSavedSets")} message={t("workoutHasNoSets")} />
                }
                renderItem={({ item, index }) => (
                    <Card style={styles.card}>
                        <Text style={sharedStyles.cardTitle}>
                            {item.exercise_name_snapshot ?? t("exercise")}
                        </Text>

                        <Text style={sharedStyles.mutedText}>
                            {t("set")} {index + 1}: {formatNumber.format(item.weight ?? 0)} kg ×{" "}
                            {item.reps ?? 0} {t("reps").toLowerCase()}
                        </Text>

                        <Text
                            style={[
                                styles.statusText,
                                item.is_completed ? styles.completedText : styles.skippedText,
                            ]}
                        >
                            {item.is_completed ? t("completed") : t("skipped")}
                        </Text>
                    </Card>
                )}
            />
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
}));
