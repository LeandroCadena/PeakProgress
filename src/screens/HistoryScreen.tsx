import { useLanguage } from "../i18n/LanguageProvider";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { useToast } from "../context/ToastContext";
import { getCompletedWorkoutSessions } from "../services/historyService";
import { spacing, useAppTheme, createThemedStyles } from "../theme";

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
    const { locale, t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { showToast } = useToast();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);

    const fetchSessions = useCallback(async () => {
        try {
            const data = await getCompletedWorkoutSessions();
            setSessions(data as WorkoutSession[]);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("workoutHistoryError"),
            });
        }
    }, [showToast, t]);

    useFocusEffect(
        useCallback(() => {
            fetchSessions();
        }, [fetchSessions])
    );

    function formatDate(value: string) {
        return new Date(value).toLocaleDateString(locale);
    }

    function getDuration(startedAt: string, completedAt: string | null) {
        if (!completedAt) return t("notCompleted");

        const start = new Date(startedAt).getTime();
        const end = new Date(completedAt).getTime();
        const minutes = Math.max(1, Math.round((end - start) / 60000));

        return `${minutes} min`;
    }

    return (
        <ScreenContainer>
            <Text style={sharedStyles.screenTitle}>{t("workoutHistory")}</Text>

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyStateCard
                        title={t("noCompletedWorkouts")}
                        message={t("firstWorkoutHistory")}
                    />
                }
                renderItem={({ item }) => {
                    const routineName =
                        item.routine_name_snapshot ?? item.routines?.[0]?.name ?? t("routine");

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
                                    {t("sets")}: {item.total_sets ?? 0} · {t("volume")}:{" "}
                                    {Number(item.total_volume ?? 0).toLocaleString(locale)} kg
                                </Text>
                                <Text style={styles.cardText}>{formatDate(item.started_at)}</Text>
                                <Text style={styles.cardText}>
                                    {t("duration")}:{" "}
                                    {getDuration(item.started_at, item.completed_at)}
                                </Text>
                            </Card>
                        </Pressable>
                    );
                }}
            />
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
}));
