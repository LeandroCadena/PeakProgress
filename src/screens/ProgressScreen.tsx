import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text, StyleSheet, FlatList, Alert, Pressable } from "react-native";

import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { getExerciseProgress } from "../services/progressService";
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
    }, [user])

    useFocusEffect(
        useCallback(() => {
            fetchPersonalRecords();
        }, [fetchPersonalRecords])
    );

    return (
        <ScreenContainer>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Your personal records</Text>

            <FlatList
                data={records}
                keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
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

                        <Text>Best Volume: {item.bestVolume} kg</Text>
                        <Text>
                            {item.bestWeight} kg x {item.bestReps} reps
                        </Text>
                    </Pressable>
                )}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
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
