import { RouteProp, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";

import Card from "../components/common/Card";
import LoadingCard from "../components/common/LoadingCard";
import ScreenContainer from "../components/common/ScreenContainer";
import { getExerciseDetail } from "../services/exerciseService";
import { colors, componentStyles, sharedStyles, spacing, typography } from "../theme";

type RouteParams = {
    ExerciseDetail: {
        exerciseId: string;
    };
};

export default function ExerciseDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, "ExerciseDetail">>();
    const { exerciseId } = route.params;

    const [exercise, setExercise] = useState<any>(null);

    const fetchExerciseDetail = useCallback(async () => {
        try {
            const data = await getExerciseDetail(exerciseId);
            setExercise(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [exerciseId]);

    useEffect(() => {
        fetchExerciseDetail();
    }, [exerciseId, fetchExerciseDetail]);

    if (!exercise) {
        return (
            <ScreenContainer>
                <LoadingCard />
            </ScreenContainer>
        );
    }

    const muscles =
        exercise.exercise_muscles
            ?.map((item: any) => item.muscles?.name)
            .filter(Boolean)
            .join(", ") ?? "No muscles listed";

    return (
        <ScreenContainer scroll>
            {exercise.image_url ? (
                <Image source={{ uri: exercise.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No image available</Text>
                </View>
            )}

            <Text style={styles.title}>{exercise.name}</Text>

            <Text style={styles.meta}>
                {exercise.equipment ?? "No equipment"} · {exercise.difficulty ?? "No difficulty"}
            </Text>

            <Card style={styles.infoCard}>
                <Text style={sharedStyles.screenTitle}>Muscles</Text>
                <Text style={styles.text}>{muscles}</Text>
            </Card>

            {exercise.description ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>Description</Text>
                    <Text style={styles.text}>{exercise.description}</Text>
                </Card>
            ) : null}

            {exercise.instructions ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>Instructions</Text>
                    <Text style={styles.text}>{exercise.instructions}</Text>
                </Card>
            ) : null}

            {exercise.tips ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>Tips</Text>
                    <Text style={styles.text}>{exercise.tips}</Text>
                </Card>
            ) : null}

            {exercise.animation_url ? (
                <Card style={styles.infoCard}>
                    <Text style={sharedStyles.screenTitle}>Execution</Text>
                    <Image source={{ uri: exercise.animation_url }} style={styles.animation} />
                </Card>
            ) : null}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
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
});
