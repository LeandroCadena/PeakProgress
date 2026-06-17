import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Exercise } from "../types/exercise";
import { RoutineExercise } from "../types/workout";
import { getExercises } from "../services/exerciseService";
import {
    getRoutineExercises,
    addExerciseToRoutine as addExerciseToRoutineService,
    deleteRoutineExercise as deleteRoutineExerciseService,
    updateRoutineExerciseConfig,
    getOrCreateActiveWorkoutSession,
} from "../services/workoutService";
import {
    updateRoutine,
    deleteRoutineById,
} from "../services/routineService";

type Params = {
    routineId: string;
    routineName: string;
    navigation: any;
};

export function useRoutineDetail({ routineId, routineName, navigation }: Params) {
    const { user } = useAuth();

    const [routineTitle, setRoutineTitle] = useState(routineName);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);

    const [sets, setSets] = useState("3");
    const [reps, setReps] = useState("10");
    const [weight, setWeight] = useState("0");
    const [restSeconds, setRestSeconds] = useState("90");

    const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null);
    const [editSets, setEditSets] = useState("");
    const [editReps, setEditReps] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editRestSeconds, setEditRestSeconds] = useState("");

    const [editRoutineVisible, setEditRoutineVisible] = useState(false);
    const [editRoutineName, setEditRoutineName] = useState(routineName);
    const [editRoutineDescription, setEditRoutineDescription] = useState("");

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

    async function deleteRoutineExercise(routineExerciseId: string) {
        try {
            await deleteRoutineExerciseService(routineExerciseId);
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
    }

    async function deleteRoutine() {
        Alert.alert("Delete routine", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
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
                },
            },
        ]);
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

    useEffect(() => {
        fetchAvailableExercises();
        fetchRoutineExercises();
    }, [routineId]);

    return {
        routineTitle,
        availableExercises,
        routineExercises,

        sets,
        reps,
        weight,
        restSeconds,
        setSets,
        setReps,
        setWeight,
        setRestSeconds,

        editingExercise,
        setEditingExercise,
        editSets,
        editReps,
        editWeight,
        editRestSeconds,
        setEditSets,
        setEditReps,
        setEditWeight,
        setEditRestSeconds,

        editRoutineVisible,
        setEditRoutineVisible,
        editRoutineName,
        editRoutineDescription,
        setEditRoutineName,
        setEditRoutineDescription,

        addExerciseToRoutine,
        openEditModal,
        saveEditedExercise,
        deleteRoutineExercise,
        saveRoutineChanges,
        deleteRoutine,
        startWorkout,
    };
}