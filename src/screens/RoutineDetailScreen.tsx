import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Pressable,
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
import EditRoutineExerciseModal from "../components/routine/EditRoutineExerciseModal";
import EditRoutineModal from "../components/routine/EditRoutineModal";

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

            <EditRoutineExerciseModal
                visible={!!editingExercise}
                sets={editSets}
                reps={editReps}
                weight={editWeight}
                restSeconds={editRestSeconds}
                onChangeSets={setEditSets}
                onChangeReps={setEditReps}
                onChangeWeight={setEditWeight}
                onChangeRestSeconds={setEditRestSeconds}
                onSave={saveEditedExercise}
                onCancel={() => setEditingExercise(null)}
            />

            <EditRoutineModal
                visible={editRoutineVisible}
                name={editRoutineName}
                description={editRoutineDescription}
                onChangeName={setEditRoutineName}
                onChangeDescription={setEditRoutineDescription}
                onSave={saveRoutineChanges}
                onCancel={() => setEditRoutineVisible(false)}
            />
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
});