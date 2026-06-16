import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Pressable,
    TextInput,
    Modal,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

type RouteParams = {
    RoutineDetail: {
        routineId: string;
        routineName: string;
    };
};

type Exercise = {
    id: string;
    name: string;
};

type RoutineExercise = {
    id: string;
    exercise_id: string;
    sets: number;
    reps: number;
    weight: number | null;
    rest_seconds: number;
    exercise: {
        id: string;
        name: string;
    } | null;
};

export default function RoutineDetailScreen({ navigation }: any) {
    const { user } = useAuth();
    const route = useRoute<RouteProp<RouteParams, "RoutineDetail">>();
    const { routineId, routineName } = route.params;

    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null);
    const [editSets, setEditSets] = useState("");
    const [editReps, setEditReps] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editRestSeconds, setEditRestSeconds] = useState("");
    const [routineTitle, setRoutineTitle] = useState(routineName);
    const [editRoutineVisible, setEditRoutineVisible] = useState(false);
    const [editRoutineName, setEditRoutineName] = useState(routineName);
    const [editRoutineDescription, setEditRoutineDescription] = useState("");

    const [sets, setSets] = useState("3");
    const [reps, setReps] = useState("10");
    const [weight, setWeight] = useState("0");
    const [restSeconds, setRestSeconds] = useState("90");

    useEffect(() => {
        fetchAvailableExercises();
        fetchRoutineExercises();
    }, []);

    async function fetchAvailableExercises() {
        const { data, error } = await supabase
            .from("exercises")
            .select("id, name")
            .order("name");

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setAvailableExercises(data ?? []);
    }

    async function fetchRoutineExercises() {
        const { data, error } = await supabase
            .from("routine_exercises")
            .select(`
            id,
            exercise_id,
            sets,
            reps,
            weight,
            rest_seconds,
            exercise:exercises (
                id,
                name
                )
            `)
            .eq("routine_id", routineId)
            .order("position");
        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        const normalizedData = (data ?? []).map((item: any) => ({
            ...item,
            exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise,
        }));

        setRoutineExercises(normalizedData as RoutineExercise[]);
    }

    async function addExerciseToRoutine(exerciseId: string) {
        const { error } = await supabase.from("routine_exercises").insert({
            routine_id: routineId,
            exercise_id: exerciseId,
            sets: Number(sets),
            reps: Number(reps),
            weight: Number(weight),
            rest_seconds: Number(restSeconds),
            position: routineExercises.length,
        });

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        await fetchRoutineExercises();
    }

    async function startWorkout() {
        if (!user?.id) {
            Alert.alert("Auth error", "User is not logged in");
            return;
        }

        const { data: existingSession, error: existingError } = await supabase
            .from("workout_sessions")
            .select("id")
            .eq("user_id", user.id)
            .eq("routine_id", routineId)
            .is("completed_at", null)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingError) {
            Alert.alert("Error", existingError.message);
            return;
        }

        if (existingSession) {
            navigation.navigate("WorkoutSession", {
                sessionId: existingSession.id,
                routineId,
                routineName,
            });
            return;
        }

        const { data, error } = await supabase
            .from("workout_sessions")
            .insert({
                user_id: user.id,
                routine_id: routineId,
            })
            .select("id")
            .single();

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        navigation.navigate("WorkoutSession", {
            sessionId: data.id,
            routineId,
            routineName,
        });
    }

    async function deleteRoutineExercise(routineExerciseId: string) {
        const { error } = await supabase
            .from("routine_exercises")
            .delete()
            .eq("id", routineExerciseId);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        await fetchRoutineExercises();
    }

    function openEditModal(item: RoutineExercise) {
        setEditingExercise(item);
        setEditSets(String(item.sets));
        setEditReps(String(item.reps));
        setEditWeight(String(item.weight ?? 0));
        setEditRestSeconds(String(item.rest_seconds));
    }

    async function saveEditedExercise() {
        if (!editingExercise) return;

        const { error } = await supabase
            .from("routine_exercises")
            .update({
                sets: Number(editSets),
                reps: Number(editReps),
                weight: Number(editWeight),
                rest_seconds: Number(editRestSeconds),
            })
            .eq("id", editingExercise.id);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setEditingExercise(null);
        await fetchRoutineExercises();
    }

    async function saveRoutineChanges() {
        if (!editRoutineName.trim()) {
            Alert.alert("Validation", "Routine name is required");
            return;
        }

        const { error } = await supabase
            .from("routines")
            .update({
                name: editRoutineName.trim(),
                description: editRoutineDescription.trim() || null,
            })
            .eq("id", routineId);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setRoutineTitle(editRoutineName.trim());
        setEditRoutineVisible(false);
    }

    async function deleteRoutine() {
        Alert.alert("Delete routine", "Are you sure?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const { error } = await supabase
                        .from("routines")
                        .delete()
                        .eq("id", routineId);

                    if (error) {
                        Alert.alert("Error", error.message);
                        return;
                    }

                    navigation.goBack();
                },
            },
        ]);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineTitle}</Text>

            <Text style={styles.sectionTitle}>Current exercises</Text>

            <View style={styles.routineActions}>
                <Pressable
                    style={styles.editRoutineButton}
                    onPress={() => setEditRoutineVisible(true)}
                >
                    <Text style={styles.actionText}>Edit Routine</Text>
                </Pressable>

                <Pressable style={styles.deleteRoutineButton} onPress={deleteRoutine}>
                    <Text style={styles.actionText}>Delete Routine</Text>
                </Pressable>
            </View>

            <Pressable style={styles.startButton} onPress={startWorkout}>
                <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>

            <FlatList
                data={routineExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No exercises added yet.</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            {item.exercise?.name ?? "Exercise"}
                        </Text>

                        <Text style={styles.cardText}>
                            {item.sets} sets · {item.reps} reps · {item.weight ?? 0} kg ·{" "}
                            {item.rest_seconds}s rest
                        </Text>

                        <View style={styles.cardActions}>
                            <Pressable
                                style={styles.editButton}
                                onPress={() => openEditModal(item)}
                            >
                                <Text style={styles.actionText}>Edit</Text>
                            </Pressable>

                            <Pressable
                                style={styles.deleteButton}
                                onPress={() => deleteRoutineExercise(item.id)}
                            >
                                <Text style={styles.actionText}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            />

            <Text style={styles.sectionTitle}>Add exercise</Text>

            <FlatList
                data={availableExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.addCard}
                        onPress={() => addExerciseToRoutine(item.id)}
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardText}>Tap to add</Text>
                    </Pressable>
                )}
            />
            <Modal
                visible={!!editingExercise}
                transparent
                animationType="slide"
                onRequestClose={() => setEditingExercise(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Exercise</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Sets"
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                            value={editSets}
                            onChangeText={setEditSets}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Reps"
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                            value={editReps}
                            onChangeText={setEditReps}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Weight"
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                            value={editWeight}
                            onChangeText={setEditWeight}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Rest seconds"
                            placeholderTextColor="#6B7280"
                            keyboardType="numeric"
                            value={editRestSeconds}
                            onChangeText={setEditRestSeconds}
                        />

                        <Pressable style={styles.button} onPress={saveEditedExercise}>
                            <Text style={styles.buttonText}>Save Changes</Text>
                        </Pressable>

                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => setEditingExercise(null)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={editRoutineVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditRoutineVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Routine</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Routine name"
                            placeholderTextColor="#6B7280"
                            value={editRoutineName}
                            onChangeText={setEditRoutineName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Description"
                            placeholderTextColor="#6B7280"
                            value={editRoutineDescription}
                            onChangeText={setEditRoutineDescription}
                        />

                        <Pressable style={styles.button} onPress={saveRoutineChanges}>
                            <Text style={styles.buttonText}>Save Changes</Text>
                        </Pressable>

                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => setEditRoutineVisible(false)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
        marginBottom: 12,
    },
    list: {
        gap: 12,
        paddingBottom: 12,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    addCard: {
        backgroundColor: "#102A1A",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#4CAF50",
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
    emptyText: {
        color: "#9CA3AF",
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    smallInput: {
        flex: 1,
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    startButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    startButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },
    cardActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    editButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        paddingVertical: 10,
        borderRadius: 10,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: "#EF4444",
        paddingVertical: 10,
        borderRadius: 10,
    },
    actionText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
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
    input: {
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
    routineActions: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    editRoutineButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        paddingVertical: 12,
        borderRadius: 12,
    },
    deleteRoutineButton: {
        flex: 1,
        backgroundColor: "#EF4444",
        paddingVertical: 12,
        borderRadius: 12,
    },
});