import { localizedExerciseText } from "../i18n/exerciseText";
import { useLanguage } from "../i18n/LanguageProvider";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import LoadingCard from "../components/common/LoadingCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { getExerciseDetail } from "../services/exerciseService";
import { componentStyles, spacing, typography, useAppTheme, createThemedStyles } from "../theme";

type RouteParams = {
    ExerciseDetail: {
        exerciseId: string;
    };
};

export default function ExerciseDetailScreen() {
    const { language, t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const route = useRoute<RouteProp<RouteParams, "ExerciseDetail">>();
    const { exerciseId } = route.params;

    const [exercise, setExercise] = useState<Awaited<ReturnType<typeof getExerciseDetail>>>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const fetchExerciseDetail = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const data = await getExerciseDetail(exerciseId);
            setExercise(data);
        } catch (error: unknown) {
            setExercise(null);

            const message = error instanceof Error ? error.message : t("exerciseDetailLoadError");

            setLoadError(message);
        } finally {
            setLoading(false);
        }
    }, [exerciseId, t]);

    useEffect(() => {
        fetchExerciseDetail();
    }, [exerciseId, fetchExerciseDetail]);

    if (loading) {
        return (
            <ScreenContainer>
                <LoadingCard />
            </ScreenContainer>
        );
    }

    if (!exercise) {
        return (
            <ScreenContainer>
                <EmptyStateCard
                    title={t("exerciseUnavailable")}
                    message={loadError ?? t("exerciseMissing")}
                />
            </ScreenContainer>
        );
    }

    const muscles =
        exercise.exercise_muscles
            ?.map((item: any) => item.muscles?.name)
            .filter(Boolean)
            .join(", ") || t("noMusclesListed");

    const name = localizedExerciseText(exercise, "name", language);
    const description = localizedExerciseText(exercise, "description", language);
    const instructions = localizedExerciseText(exercise, "instructions", language);
    const tips = localizedExerciseText(exercise, "tips", language);

    return (
        <ScreenContainer scroll>
            {exercise.image_url ? (
                <Image source={{ uri: exercise.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>{t("noExerciseImage")}</Text>
                </View>
            )}

            <Text style={styles.title}>{name}</Text>

            <Text style={styles.meta}>
                {exercise.equipment ?? t("noEquipment")} ·{" "}
                {exercise.difficulty ?? t("noDifficulty")}
            </Text>

            <Card style={styles.infoCard}>
                <Text style={sharedStyles.screenTitle}>{t("muscles")}</Text>
                <Text style={styles.text}>{muscles}</Text>
            </Card>

            {description ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>{t("description")}</Text>
                    <Text style={styles.text}>{description}</Text>
                </Card>
            ) : null}

            {instructions ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>{t("instructions")}</Text>
                    <Text style={styles.text}>{instructions}</Text>
                </Card>
            ) : null}

            {tips ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>{t("tips")}</Text>
                    <Text style={styles.text}>{tips}</Text>
                </Card>
            ) : null}

            {exercise.animation_url ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>{t("execution")}</Text>
                    <Image source={{ uri: exercise.animation_url }} style={styles.animation} />
                </Card>
            ) : null}
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
    image: {
        width: "100%",
        height: 220,
        borderRadius: componentStyles.cardRadius,
        marginBottom: spacing.lg,
        backgroundColor: colors.card,
    },
    imagePlaceholder: {
        height: 220,
        borderRadius: componentStyles.cardRadius,
        backgroundColor: colors.card,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.lg,
    },
    placeholderText: {
        color: colors.textSecondary,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightExtraBold,
    },
    meta: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    infoCard: {
        marginBottom: spacing.md,
    },
    text: {
        color: colors.textSecondary,
        lineHeight: 22,
    },
    animation: {
        width: "100%",
        height: 220,
        borderRadius: componentStyles.cardRadius,
        marginTop: spacing.sm,
        backgroundColor: colors.card,
    },
}));
