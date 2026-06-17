import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { RoutineExercise, SavedSet } from "../types/workout";
import {
    getRoutineExercises,
    getSavedSets,
    createEmptyWorkoutSet,
    updateWorkoutSetValue,
    toggleWorkoutSetCompleted,
    deleteWorkoutSet,
    finishWorkoutSession,
} from "../services/workoutService";

type Params = {
    sessionId: string;
    routineId: string;
    onFinish: () => void;
};

export function useWorkoutSession({ sessionId, routineId, onFinish }: Params) {
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [savedSets, setSavedSets] = useState<Record<string, SavedSet[]>>({});
    const [editingValues, setEditingValues] = useState<Record<string, string>>({});
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);

    async function fetchRoutineExercises() {
        try {
            const data = await getRoutineExercises(routineId);
            setRoutineExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchSavedSets() {
        try {
            const data = await getSavedSets(sessionId);
            setSavedSets(data);
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

            if (!set.is_completed) {
                const routineExercise = routineExercises.find(
                    (item) => item.exercise_id === set.exercise_id
                );

                setTimer(routineExercise?.rest_seconds ?? 90);
                setTimerRunning(true);
            }
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
            onFinish();
        } catch (error: any) {
            Alert.alert("Error finishing workout", error.message);
        }
    }

    function getSetInputValue(
        setId: string,
        field: "weight" | "reps",
        value: number | null
    ) {
        const key = `${setId}-${field}`;
        return editingValues[key] ?? String(value ?? 0);
    }

    function updateLocalSetValue(
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        const key = `${setId}-${field}`;

        setEditingValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function startTimer() {
        setTimerRunning(true);
    }

    function pauseTimer() {
        setTimerRunning(false);
    }

    function resetTimer() {
        setTimer(0);
        setTimerRunning(false);
    }

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

    return {
        routineExercises,
        savedSets,
        timer,
        startTimer,
        pauseTimer,
        resetTimer,
        addEmptySet,
        updateSetValue,
        toggleSetCompleted,
        deleteSet,
        finishWorkout,
        getSetInputValue,
        updateLocalSetValue,
    };
}