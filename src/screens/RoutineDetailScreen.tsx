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
    ScrollView,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
    updateRoutine,
    deleteRoutineById,
} from "../services/routineService";
import { getExercises } from "../services/exerciseService";
import {
    getRoutineExercises,
    addExerciseToRoutine as addExerciseToRoutineService,
    getOrCreateActiveWorkoutSession,
    deleteRoutineExercise as deleteRoutineExerciseService,
    updateRoutineExerciseConfig,
} from "../services/workoutService";
import { RoutineExercise } from "../types/workout";
import RoutineExerciseCard from "../components/routine/RoutineExerciseCard";
import AvailableExerciseCard from "../components/routine/AvailableExerciseCard";
import RoutineActions from "../components/routine/RoutineActions";
import RoutineDetailLayout from "../components/routine/RoutineDetailLayout";

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
        try {
            const data = await getExercises();
            setAvailableExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchRoutineExercises() {
        try {
            const data = await getRoutineExercises(routineId);
            setRoutineExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function addExerciseToRoutine(exerciseId: string) {
        try {
            await addExerciseToRoutineService({
                routineId,
                exerciseId,
                sets: Number(sets),
                reps: Number(reps),
                weight: Number(weight),
                restSeconds: Number(restSeconds),
                position: routineExercises.length,
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function startWorkout() {
        if (!user?.id) {
            Alert.alert("Auth error", "User is not logged in");
            return;
        }

        try {
            const session = await getOrCreateActiveWorkoutSession({
                userId: user.id,
                routineId,
            });

            navigation.navigate("WorkoutSession", {
                sessionId: session.id,
                routineId,
                routineName,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteRoutineExercise(routineExerciseId: string) {
        try {
            await deleteRoutineExerciseService(routineExerciseId);
            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
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

        try {
            await updateRoutineExerciseConfig({
                routineExerciseId: editingExercise.id,
                sets: Number(editSets),
                reps: Number(editReps),
                weight: Number(editWeight),
                restSeconds: Number(editRestSeconds),
            });

            setEditingExercise(null);
            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function saveRoutineChanges() {
        if (!editRoutineName.trim()) {
            Alert.alert("Validation", "Routine name is required");
            return;
        }

        try {
            await updateRoutine({
                routineId,
                name: editRoutineName,
                description: editRoutineDescription,
            });

            setRoutineTitle(editRoutineName.trim());
            setEditRoutineVisible(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
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
                    try {
                        await deleteRoutineById(routineId);
                        navigation.goBack();
                    } catch (error: any) {
                        Alert.alert("Error", error.message);
                    }

                    navigation.goBack();
                },
            },
        ]);
    }

    return (
        <RoutineDetailLayout>
            <Text style={styles.title}>{routineTitle}</Text>

            <RoutineActions
                onEdit={() => setEditRoutineVisible(true)}
                onDelete={deleteRoutine}
            />

            <Pressable style={styles.startButton} onPress={startWorkout}>
                <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Current exercises</Text>

            {routineExercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises added yet.</Text>
            ) : (
                <View style={styles.list}>
                    {routineExercises.map((item) => (
                        <RoutineExerciseCard
                            key={item.id}
                            item={item}
                            onEdit={() => openEditModal(item)}
                            onDelete={() => deleteRoutineExercise(item.id)}
                        />
                    ))}
                </View>
            )}

            <Text style={styles.sectionTitle}>Add exercise</Text>

            <View style={styles.list}>
                {availableExercises.map((item) => (
                    <AvailableExerciseCard
                        key={item.id}
                        exercise={item}
                        onPress={() => addExerciseToRoutine(item.id)}
                    />
                ))}
            </View>

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
        </RoutineDetailLayout>
    );
}

const styles = StyleSheet.create({
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
    addCard: {
        backgroundColor: "#102A1A",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#4CAF50",
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
});