import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";

type WorkoutSet = {
    id: string;
    weight: number | null;
    reps: number;
    exercise: {
        id: string;
        name: string;
    } | null;
};

type ExerciseProgress = {
    exerciseName: string;
    bestWeight: number;
    bestReps: number;
    totalVolume: number;
    totalSets: number;
};

export default function ProgressScreen() {
    const [records, setRecords] = useState<ExerciseProgress[]>([]);

    async function fetchPersonalRecords() {
        const { data, error } = await supabase
            .from("workout_sets")
            .select(`
      id,
      weight,
      reps,
      exercise:exercises (
        id,
        name
      )
    `);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        const sets = (data ?? []).map((item: any) => ({
            ...item,
            exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
        })) as WorkoutSet[];

        const progressByExercise: Record<string, ExerciseProgress> = {};

        sets.forEach((set) => {
            const exerciseName = set.exercise?.name ?? "Exercise";
            const weight = Number(set.weight ?? 0);
            const reps = Number(set.reps ?? 0);
            const volume = weight * reps;

            if (!progressByExercise[exerciseName]) {
                progressByExercise[exerciseName] = {
                    exerciseName,
                    bestWeight: weight,
                    bestReps: reps,
                    totalVolume: volume,
                    totalSets: 1,
                };
                return;
            }

            const current = progressByExercise[exerciseName];

            current.totalVolume += volume;
            current.totalSets += 1;

            if (weight > current.bestWeight) {
                current.bestWeight = weight;
                current.bestReps = reps;
            }
        });

        setRecords(Object.values(progressByExercise));
    }

    useFocusEffect(
        useCallback(() => {
            fetchPersonalRecords();
        }, [])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Your personal records</Text>

            <FlatList
                data={records}
                keyExtractor={(item) => item.exerciseName}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No records yet. Complete a workout first.</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.exerciseName}</Text>

                        <Text style={styles.cardValue}>
                            PR: {item.bestWeight} kg x {item.bestReps}
                        </Text>

                        <Text style={styles.cardText}>
                            Total Volume: {item.totalVolume} kg
                        </Text>

                        <Text style={styles.cardText}>
                            Total Sets: {item.totalSets}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 20,
    },
    list: {
        gap: 12,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    cardValue: {
        color: "#4CAF50",
        fontSize: 28,
        fontWeight: "800",
        marginTop: 8,
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 4,
    },
    emptyText: {
        color: "#9CA3AF",
    },
});