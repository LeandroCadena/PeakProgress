import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { RoutineExercise } from "../types/workout";
import {
    getRoutineExercises,
    deleteRoutineExercise as deleteRoutineExerciseService,
    updateRoutineExerciseConfig,
    getOrCreateActiveWorkoutSession,
    updateRoutineExercisePosition,
} from "../services/workoutService";
import {
    updateRoutine,
    deleteRoutineById,
} from "../services/routineService";
import { useFocusEffect } from "@react-navigation/native";

type Params = {
    routineId: string;
    routineName: string;
    navigation: any;
};

export function useRoutineDetail({ routineId, routineName, navigation }: Params) {
    const { user } = useAuth();

    const [routineTitle, setRoutineTitle] = useState(routineName);
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);

    const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null);
    const [editSets, setEditSets] = useState("");
    const [editReps, setEditReps] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editRestSeconds, setEditRestSeconds] = useState("");

    const [editRoutineVisible, setEditRoutineVisible] = useState(false);
    const [editRoutineName, setEditRoutineName] = useState(routineName);
    const [editRoutineDescription, setEditRoutineDescription] = useState("");

    const [isEditingRoutine, setIsEditingRoutine] = useState(false);
    const [draftRoutineName, setDraftRoutineName] = useState(routineName);
    const [draftRoutineDescription, setDraftRoutineDescription] = useState("");

    async function fetchRoutineExercises() {
        try {
            const data = await getRoutineExercises(routineId);
            setRoutineExercises(data);
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
        if (!draftRoutineName.trim()) {
            Alert.alert("Validation", "Routine name is required");
            return;
        }

        try {
            await updateRoutine({
                routineId,
                name: draftRoutineName,
                description: draftRoutineDescription,
            });

            setRoutineTitle(draftRoutineName.trim());
            setEditRoutineDescription(draftRoutineDescription);
            setIsEditingRoutine(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteRoutine() {
        try {
            await deleteRoutineById(routineId);
            navigation.goBack();
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

    function startEditingRoutine() {
        setDraftRoutineName(routineTitle);
        setDraftRoutineDescription(editRoutineDescription);
        setIsEditingRoutine(true);
    }

    function cancelEditingRoutine() {
        setDraftRoutineName(routineTitle);
        setDraftRoutineDescription(editRoutineDescription);
        setIsEditingRoutine(false);
    }

    async function moveRoutineExercise(index: number, direction: "up" | "down") {
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= routineExercises.length) return;

        const current = routineExercises[index];
        const target = routineExercises[targetIndex];

        const updated = [...routineExercises];

        updated[index] = target;
        updated[targetIndex] = current;

        setRoutineExercises(updated);

        try {
            await Promise.all([
                updateRoutineExercisePosition({
                    routineExerciseId: current.id,
                    position: targetIndex,
                }),
                updateRoutineExercisePosition({
                    routineExerciseId: target.id,
                    position: index,
                }),
            ]);

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
            await fetchRoutineExercises();
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchRoutineExercises();
        }, [routineId])
    );

    return {
        routineTitle,
        routineExercises,
        moveRoutineExercise,

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

        openEditModal,
        saveEditedExercise,
        deleteRoutineExercise,
        saveRoutineChanges,
        deleteRoutine,
        startWorkout,

        isEditingRoutine,
        draftRoutineName,
        draftRoutineDescription,
        setDraftRoutineName,
        setDraftRoutineDescription,
        startEditingRoutine,
        cancelEditingRoutine,
    };
}