import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Alert,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import {
    WorkoutSessionRouteParams,
    RoutineExercise,
    SavedSet,
} from "../types/workout";
import {
    getRoutineExercises,
    getSavedSets,
    updateWorkoutSetValue,
    toggleWorkoutSetCompleted,
    deleteWorkoutSet,
    createEmptyWorkoutSet,
    finishWorkoutSession,
} from "../services/workoutService";
import RestTimerCard from "../components/workout/RestTimerCard";
import WorkoutExerciseCard from "../components/workout/WorkoutExerciseCard";

export default function WorkoutSessionScreen({ navigation }: any) {
    const route = useRoute<RouteProp<WorkoutSessionRouteParams, "WorkoutSession">>();
    const { sessionId, routineId, routineName } = route.params;

    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [weightByExercise, setWeightByExercise] = useState<Record<string, string>>({});
    const [repsByExercise, setRepsByExercise] = useState<Record<string, string>>({});
    const [savedSets, setSavedSets] = useState<Record<string, SavedSet[]>>({});
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
        if (!sessionId) {
            Alert.alert("Error", "Missing session id");
            return;
        }

        try {
            await finishWorkoutSession(sessionId);

            navigation.navigate("WorkoutSummary", {
                sessionId,
                routineName,
            });
        } catch (error: any) {
            Alert.alert("Error finishing workout", error.message);
        }
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

            <RestTimerCard
                timer={timer}
                onStart={() => setTimerRunning(true)}
                onPause={() => setTimerRunning(false)}
                onReset={() => {
                    setTimer(0);
                    setTimerRunning(false);
                }}
            />

            <FlatList
                data={routineExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <WorkoutExerciseCard
                        exercise={item}
                        savedSets={savedSets[item.exercise_id] ?? []}
                        getSetInputValue={getSetInputValue}
                        updateLocalSetValue={updateLocalSetValue}
                        updateSetValue={updateSetValue}
                        toggleSetCompleted={toggleSetCompleted}
                        deleteSet={deleteSet}
                        addEmptySet={addEmptySet}
                    />
                )}
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
    cancelButton: {
        backgroundColor: "#374151",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 12,
    },
});