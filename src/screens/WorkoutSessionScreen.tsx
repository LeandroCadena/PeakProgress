import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    Alert,
    Modal,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import {
    WorkoutSessionRouteParams,
    RoutineExercise,
    SavedSet,
} from "../types/workout";
import {
    getRoutineExercises,
    getSavedSets,
} from "../services/workoutService";
import {
    getRoutineExercises,
    getSavedSets,
    createWorkoutSet,
    updateWorkoutSetValue,
    toggleWorkoutSetCompleted,
    deleteWorkoutSet,
    createEmptyWorkoutSet,
} from "../services/workoutService";

export default function WorkoutSessionScreen({ navigation }: any) {
    const route = useRoute<RouteProp<WorkoutSessionRouteParams, "WorkoutSession">>();
    const { sessionId, routineId, routineName } = route.params;

    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [weightByExercise, setWeightByExercise] = useState<Record<string, string>>({});
    const [repsByExercise, setRepsByExercise] = useState<Record<string, string>>({});
    const [savedSets, setSavedSets] = useState<Record<string, SavedSet[]>>({});
    const [editingSet, setEditingSet] = useState<SavedSet | null>(null);
    const [editSetWeight, setEditSetWeight] = useState("");
    const [editSetReps, setEditSetReps] = useState("");
    const [editingValues, setEditingValues] = useState<Record<string, string>>({});
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);

    useEffect(() => {
        if (!sessionId || !routineId) return;

        fetchRoutineExercises();
        fetchSavedSets();
    }, [sessionId, routineId]);

    useEffect(() => {
        if (!timerRunning || timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setTimerRunning(false);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerRunning, timer]);

    async function fetchRoutineExercises() {
        try {
            const items = await getRoutineExercises(routineId);

            setRoutineExercises(items);

            const initialWeights: Record<string, string> = {};
            const initialReps: Record<string, string> = {};

            items.forEach((item) => {
                initialWeights[item.exercise_id] = String(item.weight ?? 0);
                initialReps[item.exercise_id] = String(item.reps ?? 10);
            });

            setWeightByExercise(initialWeights);
            setRepsByExercise(initialReps);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchSavedSets() {
        try {
            const groupedSets = await getSavedSets(sessionId);
            setSavedSets(groupedSets);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteSet(setId: string) {
        try {
            await deleteWorkoutSet(setId);
            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function finishWorkout() {
        console.log("Finishing workout:", { sessionId });

        if (!sessionId) {
            Alert.alert("Error", "Missing session id");
            return;
        }

        const completedAt = new Date().toISOString();

        const { data, error } = await supabase
            .from("workout_sessions")
            .update({ completed_at: completedAt })
            .eq("id", sessionId)
            .select("id, completed_at")
            .single();

        console.log("Finish workout result:", { data, error });

        if (error) {
            Alert.alert("Error finishing workout", error.message);
            return;
        }

        navigation.navigate("WorkoutSummary", {
            sessionId,
            routineName,
        });
    }

    async function updateSetValue(
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            Alert.alert("Validation", "Please enter a valid number");
            return;
        }

        try {
            await updateWorkoutSetValue({
                setId,
                field,
                value: numericValue,
            });

            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function toggleSetCompleted(set: SavedSet) {
        try {
            await toggleWorkoutSetCompleted({
                setId: set.id,
                isCompleted: set.is_completed,
            });

            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function addEmptySet(exerciseId: string) {
        const currentSets = savedSets[exerciseId] ?? [];
        const setNumber = currentSets.length + 1;

        try {
            await createEmptyWorkoutSet({
                sessionId,
                exerciseId,
                setNumber,
            });

            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function getSetInputValue(setId: string, field: "weight" | "reps", value: number | null) {
        const key = `${setId}-${field}`;
        return editingValues[key] ?? String(value ?? 0);
    }

    function updateLocalSetValue(setId: string, field: "weight" | "reps", value: string) {
        const key = `${setId}-${field}`;

        setEditingValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineName}</Text>
            <Text style={styles.subtitle}>Workout Session</Text>

            <View style={styles.timerCard}>
                <Text style={styles.timerLabel}>Rest Timer</Text>
                <Text style={styles.timerText}>{timer}s</Text>

                <View style={styles.timerActions}>
                    <Pressable
                        style={styles.timerButton}
                        onPress={() => setTimerRunning(true)}
                    >
                        <Text style={styles.buttonText}>Start</Text>
                    </Pressable>

                    <Pressable
                        style={styles.timerButton}
                        onPress={() => setTimerRunning(false)}
                    >
                        <Text style={styles.buttonText}>Pause</Text>
                    </Pressable>

                    <Pressable
                        style={styles.timerButton}
                        onPress={() => {
                            setTimer(0);
                            setTimerRunning(false);
                        }}
                    >
                        <Text style={styles.buttonText}>Reset</Text>
                    </Pressable>
                </View>
            </View>

            <FlatList
                data={routineExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const exerciseName = item.exercise?.name ?? "Exercise";

                    return (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{exerciseName}</Text>

                            <Text style={styles.cardText}>
                                Target: {item.sets} sets · {item.reps} reps · {item.rest_seconds}s rest
                            </Text>
                            <Text style={styles.cardText}>
                                Saved sets: {savedSets[item.exercise_id]?.length ?? 0}/{item.sets}
                            </Text>

                            <View style={styles.setTableHeader}>
                                <Text style={styles.setHeaderText}>weights</Text>
                                <Text style={styles.setHeaderText}>reps</Text>
                                <Text style={styles.setHeaderText}>Done</Text>
                                <Text style={styles.setHeaderText}></Text>
                            </View>

                            {savedSets[item.exercise_id]?.map((set) => (
                                <View key={set.id} style={styles.setTableRow}>
                                    <TextInput
                                        style={[styles.setInput, set.is_completed && styles.disabledInput]}
                                        keyboardType="numeric"
                                        value={getSetInputValue(set.id, "weight", set.weight)}
                                        editable={!set.is_completed}
                                        onChangeText={(value) =>
                                            updateLocalSetValue(set.id, "weight", value)
                                        }
                                        onEndEditing={(event) =>
                                            updateSetValue(set.id, "weight", event.nativeEvent.text)
                                        }
                                    />
                                    <TextInput
                                        style={[styles.setInput, set.is_completed && styles.disabledInput]}
                                        keyboardType="numeric"
                                        value={getSetInputValue(set.id, "reps", set.reps)}
                                        editable={!set.is_completed}
                                        onChangeText={(value) =>
                                            updateLocalSetValue(set.id, "reps", value)
                                        }
                                        onEndEditing={(event) =>
                                            updateSetValue(set.id, "reps", event.nativeEvent.text)
                                        }
                                    />

                                    <Pressable
                                        style={[
                                            styles.checkbox,
                                            set.is_completed && styles.checkboxChecked,
                                        ]}
                                        onPress={() => toggleSetCompleted(set)}
                                    >
                                        <Text style={styles.checkboxText}>
                                            {set.is_completed ? "✓" : ""}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        style={styles.deleteSetButton}
                                        onPress={() => deleteSet(set.id)}
                                    >
                                        <Text style={styles.deleteSetText}>X</Text>
                                    </Pressable>
                                </View>
                            ))}

                            <Pressable
                                style={styles.addSetRow}
                                onPress={() => addEmptySet(item.exercise_id)}
                            >
                                <Text style={styles.addSetText}>+ Add Set</Text>
                            </Pressable>
                        </View>

                    );
                }}
            />

            <Pressable style={styles.finishButton} onPress={finishWorkout}>
                <Text style={styles.buttonText}>Finish Workout</Text>
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
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 20,
    },
    list: {
        gap: 14,
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
        marginBottom: 14,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 12,
    },
    finishButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
    timerCard: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
        marginBottom: 16,
    },
    timerLabel: {
        color: "#9CA3AF",
        fontSize: 14,
    },
    timerText: {
        color: "#FFFFFF",
        fontSize: 36,
        fontWeight: "800",
        marginTop: 4,
        marginBottom: 12,
    },
    timerActions: {
        flexDirection: "row",
        gap: 8,
    },
    timerButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        paddingVertical: 10,
        borderRadius: 10,
    },
    savedSetRow: {
        backgroundColor: "#0B0F14",
        padding: 10,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#30363D",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    savedSetText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
    deleteSetButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    deleteSetText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12,
    },
    setActions: {
        flexDirection: "row",
        gap: 8,
    },
    editSetButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    setActionText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        padding: 24,
    },
    modalContent: {
        backgroundColor: "#161B22",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    modalTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 16,
    },
    cancelButton: {
        backgroundColor: "#374151",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 12,
    },
    setTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 8,
        gap: 8,
    },
    setHeaderText: {
        flex: 1,
        color: "#9CA3AF",
        fontWeight: "700",
        fontSize: 12,
    },
    setTableRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    setInput: {
        flex: 1,
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    disabledInput: {
        opacity: 0.5,
    },
    checkbox: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: "#4CAF50",
    },
    checkboxText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
    addSetRow: {
        backgroundColor: "#102A1A",
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        marginTop: 6,
    },
    addSetText: {
        color: "#4CAF50",
        fontWeight: "800",
    },
});