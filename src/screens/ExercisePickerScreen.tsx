import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Alert,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { getMuscles, getExercisesByMuscle } from "../services/exerciseService";
import { addExerciseToRoutine } from "../services/workoutService";
import { Exercise, Muscle } from "../types/exercise";

type RouteParams = {
    ExercisePicker: {
        routineId: string;
        currentCount: number;
    };
};

export default function ExercisePickerScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "ExercisePicker">>();
    const { routineId, currentCount } = route.params;

    const [search, setSearch] = useState("");
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);

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
            const data = await getExercisesByMuscle(selectedMuscleId);
            setExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function handleAddExercise(exerciseId: string) {
        try {
            await addExerciseToRoutine({
                routineId,
                exerciseId,
                sets: 3,
                reps: 10,
                weight: 0,
                restSeconds: 90,
                position: currentCount,
            });

            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    useEffect(() => {
        fetchMuscles();
    }, []);

    useEffect(() => {
        fetchExercises();
    }, [selectedMuscleId]);

    const filteredExercises = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add Exercise</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search exercise"
                placeholderTextColor="#6B7280"
                value={search}
                onChangeText={setSearch}
            />

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
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() =>
                                setSelectedMuscleId(item.id === "all" ? null : item.id)
                            }
                        >
                            <Text
                                style={[styles.filterText, isSelected && styles.filterTextActive]}
                            >
                                {item.name}
                            </Text>
                        </Pressable>
                    );
                }}
            />

            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardText}>
                                {item.equipment ?? "No equipment"} ·{" "}
                                {item.difficulty ?? "No difficulty"}
                            </Text>
                        </View>

                        <Pressable
                            style={styles.addButton}
                            onPress={() => handleAddExercise(item.id)}
                        >
                            <Text style={styles.addButtonText}>Add</Text>
                        </Pressable>
                    </View>
                )}
            />

            <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
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
        marginBottom: 20,
    },
    searchInput: {
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
        marginBottom: 14,
    },
    filters: {
        gap: 10,
        marginBottom: 16,
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    addButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    cancelButton: {
        backgroundColor: "#374151",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    cancelButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});