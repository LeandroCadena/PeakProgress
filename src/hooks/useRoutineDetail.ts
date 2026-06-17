import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { RoutineExercise, RoutineExerciseSet } from "../types/workout";
import {
    getRoutineExercises,
    deleteRoutineExercise as deleteRoutineExerciseService,
    updateRoutineExerciseConfig,
    getOrCreateActiveWorkoutSession,
    updateRoutineExercisePosition,
    getRoutineExerciseSets,
    updateRoutineExerciseSet,
    createRoutineExerciseSet,
    deleteRoutineExerciseSet,
} from "../services/workoutService";
import {
    updateRoutine,
    deleteRoutineById,
} from "../services/routineService";
import { useFocusEffect } from "@react-navigation/native";
import { updateRoutineExerciseSetCount } from "../services/exerciseService";

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
    const [templateSetDraftValues, setTemplateSetDraftValues] = useState<
        Record<string, string>
    >({});

    const [editRoutineVisible, setEditRoutineVisible] = useState(false);
    const [editRoutineName, setEditRoutineName] = useState(routineName);
    const [editRoutineDescription, setEditRoutineDescription] = useState("");
    const [routineExerciseSets, setRoutineExerciseSets] = useState<
        Record<string, RoutineExerciseSet[]>
    >({});

    const [isEditingRoutine, setIsEditingRoutine] = useState(false);
    const [draftRoutineName, setDraftRoutineName] = useState(routineName);
    const [draftRoutineDescription, setDraftRoutineDescription] = useState("");

    useFocusEffect(
        useCallback(() => {
            fetchRoutineExercises();
        }, [routineId])
    );

    async function fetchRoutineExercises() {
        try {
            const data = await getRoutineExercises(routineId);
            setRoutineExercises(data);

            const setGroups = await getRoutineExerciseSets(data.map((item) => item.id));
            setRoutineExerciseSets(setGroups);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function openEditModal(item: RoutineExercise) {
        setEditingExercise(item);
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

    async function updateTemplateSet(
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
            await updateRoutineExerciseSet({
                setId,
                field,
                value: numericValue,
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function addTemplateSet(routineExerciseId: string) {
        const currentSets = routineExerciseSets[routineExerciseId] ?? [];
        const lastSet = currentSets[currentSets.length - 1];

        const setNumber = currentSets.length + 1;

        const lastWeight = lastSet
            ? getTemplateSetInputValue(lastSet.id, "weight", lastSet.weight)
            : "0";

        const lastReps = lastSet
            ? getTemplateSetInputValue(lastSet.id, "reps", lastSet.reps)
            : "0";

        try {
            await createRoutineExerciseSet({
                routineExerciseId,
                setNumber,
                reps: Number(lastReps),
                weight: Number(lastWeight),
            });

            await updateRoutineExerciseSetCount({
                routineExerciseId,
                sets: setNumber,
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteTemplateSet(routineExerciseId: string, setId: string) {
        const currentSets = routineExerciseSets[routineExerciseId] ?? [];

        try {
            await deleteRoutineExerciseSet(setId);

            await updateRoutineExerciseSetCount({
                routineExerciseId,
                sets: Math.max(0, currentSets.length - 1),
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function getTemplateSetInputValue(
        setId: string,
        field: "weight" | "reps",
        value: number | null
    ) {
        const key = `${setId}-${field}`;
        return templateSetDraftValues[key] ?? String(value ?? 0);
    }

    function updateLocalTemplateSetValue(
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        const key = `${setId}-${field}`;

        setTemplateSetDraftValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

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

        routineExerciseSets,
        updateTemplateSet,
        addTemplateSet,
        deleteTemplateSet,

        templateSetDraftValues,
        updateLocalTemplateSetValue,
    };
}