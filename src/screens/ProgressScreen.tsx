import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text, StyleSheet, FlatList, Alert, Pressable } from "react-native";

import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import SectionTitle from "../components/common/SectionTitle";
import { useAuth } from "../context/AuthContext";
import { getExerciseProgress } from "../services/progressService";
import { colors, spacing, typography } from "../theme";
import { ExerciseProgress } from "../types/progress";

export default function ProgressScreen({ navigation }: any) {
    const { user } = useAuth();

    const [records, setRecords] = useState<ExerciseProgress[]>([]);

    const fetchPersonalRecords = useCallback(async () => {
        if (!user?.id) return;

        try {
            const progress = await getExerciseProgress(user.id);
            setRecords(progress);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchPersonalRecords();
        }, [fetchPersonalRecords])
    );

    return (
        <ScreenContainer>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Track your personal records.</Text>

            <SectionTitle>Personal Records</SectionTitle>

            <FlatList
                data={records}
                keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyStateCard
                        title="No records yet"
                        message="Complete a workout to start tracking personal records."
                    />
                }
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() =>
                            navigation.navigate("ExerciseProgress", {
                                exerciseId: item.exerciseId,
                                exerciseName: item.exerciseName,
                            })
                        }
                    >
                        <Card>
                            <Text style={styles.cardTitle}>{item.exerciseName}</Text>

                            <Text style={styles.prValue}>
                                {item.bestWeight} kg × {item.bestReps} reps
                            </Text>

                            <Text style={styles.cardText}>
                                Best Volume: {item.bestVolume} kg
                            </Text>
                        </Card>
                    </Pressable>
                )}
            />
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

    list: {
        gap: spacing.md,
        paddingBottom: spacing.xxl,
    },

    cardTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
    },

    prValue: {
        color: colors.primary,
        fontSize: typography.title,
        fontWeight: "800",
        marginTop: spacing.sm,
    },

    cardText: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});
