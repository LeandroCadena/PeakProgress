import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
    getExerciseProgress,
} from "../services/progressService";
import { ExerciseProgress } from "../types/progress";

type WorkoutSet = {
    id: string;
    weight: number | null;
    reps: number;
    exercise: {
        id: string;
        name: string;
    } | null;
};

export default function ProgressScreen({ navigation }: any) {
    const [records, setRecords] = useState<ExerciseProgress[]>([]);

    async function fetchPersonalRecords() {
        try {
            const progress = await getExerciseProgress();
            setRecords(progress);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
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
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("ExerciseProgress", {
                                exerciseId: item.exerciseId,
                                exerciseName: item.exerciseName,
                            })
                        }
                    >
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
                    </Pressable>
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