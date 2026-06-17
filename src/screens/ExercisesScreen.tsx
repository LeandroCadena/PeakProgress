import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Pressable
} from "react-native";
import {
    getMuscles,
    getExercisesByFilter
} from "../services/exerciseService";
import { Exercise, Muscle } from "../types/exercise";

export default function ExercisesScreen({ navigation }: any) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);

    useEffect(() => {
        fetchMuscles();
    }, []);

    useEffect(() => {
        fetchExercises();
    }, [selectedMuscleId]);

    async function fetchMuscles() {
        try {
            const data = await getMuscles();
            setMuscles(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchExercises() {
        try {
            const data = await getExercisesByFilter({
                filterMode: "muscle",
                selectedIds: selectedMuscleId ? [selectedMuscleId] : [],
            });

            setExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Exercises</Text>

            <FlatList
                horizontal
                data={[{ id: "all", name: "All" }, ...muscles]}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.filters}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                    const isSelected =
                        item.id === "all"
                            ? selectedMuscleId === null
                            : selectedMuscleId === item.id;

                    return (
                        <Pressable
                            style={[
                                styles.filterChip,
                                isSelected && styles.filterChipActive,
                            ]}
                            onPress={() =>
                                setSelectedMuscleId(item.id === "all" ? null : item.id)
                            }
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    isSelected && styles.filterTextActive,
                                ]}
                            >
                                {item.name}
                            </Text>
                        </Pressable>
                    );
                }}
            />

            <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("ExerciseDetail", {
                                exerciseId: item.id,
                                exerciseName: item.name,
                            })
                        }
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardText}>
                            {item.equipment ?? "No equipment"} · {item.difficulty ?? "No difficulty"}
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
        marginBottom: 24,
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
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    filters: {
        gap: 10,
        marginBottom: 20,
    },
    filterChip: {
        backgroundColor: "#161B22",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    filterChipActive: {
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
    },
    filterText: {
        color: "#9CA3AF",
        fontWeight: "700",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
});