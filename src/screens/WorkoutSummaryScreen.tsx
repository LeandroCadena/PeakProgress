import { useLanguage } from "../i18n/LanguageProvider";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import StatCard from "../components/common/StatCard";
import { useToast } from "../context/ToastContext";
import { getWorkoutSummary } from "../services/historyService";
import { updateRoutineFromCompletedWorkout } from "../services/workoutSyncService";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

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
    const { locale, t } = useLanguage();
    const formatNumber = new Intl.NumberFormat(locale);
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { showToast } = useToast();
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
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("workoutSummaryError"),
            });
        }
    }, [sessionId, showToast]);

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
            <Text style={styles.title}>{t("workoutComplete")}</Text>

            <Text style={sharedStyles.screenTitle}>{routineName}</Text>

            <Card style={styles.heroCard}>
                <Text style={styles.heroValue}>
                    {formatNumber.format(summary?.totalVolume ?? 0)} kg
                </Text>

                <Text style={styles.heroLabel}>{t("totalVolume")}</Text>
            </Card>

            <View style={styles.statsRow}>
                <StatCard label={t("duration")} value={`${summary?.durationMinutes ?? 0} min`} />

                <StatCard label={t("sets")} value={summary?.totalSets ?? 0} />
            </View>

            {routineUpdateStatus === "updating" ? (
                <Text style={styles.syncText}>{t("updatingRoutine")}</Text>
            ) : null}

            {routineUpdateStatus === "success" ? (
                <Text style={styles.syncText}>{t("routineUpdated")}</Text>
            ) : null}

            {routineUpdateStatus === "error" ? (
                <Text style={styles.syncErrorText}>{t("routineUpdateError")}</Text>
            ) : null}

            <AppButton
                title={t("backToHome")}
                variant="primary"
                onPress={() => navigation.navigate("Main")}
                iconLeft={<Ionicons name="barbell-outline" size={22} color={colors.text} />}
                showChevron
            />
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
}));
