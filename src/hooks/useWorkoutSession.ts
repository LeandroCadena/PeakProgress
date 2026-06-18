import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { RoutineExercise, WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";
import {
    getSavedSets,
    createEmptyWorkoutSet,
    toggleWorkoutSetCompleted,
    deleteWorkoutSet,
    finishWorkoutSession,
    syncWorkoutSessionToRoutine,
    getWorkoutSessionExercises,
    deleteWorkoutSessionExercise,
} from "../services/workoutService";
import { useFocusEffect } from "@react-navigation/native";

type Params = {
    sessionId: string;
    routineId: string;
    routineName: string;
    onFinish: () => void;
};

export function useWorkoutSession({ sessionId, routineId, routineName, onFinish }: Params) {
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [sessionExercises, setSessionExercises] = useState<WorkoutSessionExercise[]>([]);
    const [savedSets, setSavedSets] = useState<Record<string, WorkoutSessionSet[]>>({});
    const [editingValues, setEditingValues] = useState<Record<string, string>>({});
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!sessionId || !routineId) return;

            fetchSessionExercises();
            fetchSavedSets();
        }, [sessionId, routineId])
    );

    useEffect(() => {
        if (!timerRunning || timer <= 0) return;

        const intervalId = setInterval(() => {
            setTimer((currentTimer) => {
                if (currentTimer <= 1) {
                    setTimerRunning(false);
                    return 0;
                }

                return currentTimer - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timerRunning, timer]);

    async function fetchSessionExercises() {
        try {
            const data = await getWorkoutSessionExercises(sessionId);
            setSessionExercises(data);
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

    async function addEmptySet(workoutSessionExerciseId: string) {
        const currentSets = savedSets[workoutSessionExerciseId] ?? [];
        const lastSet = currentSets[currentSets.length - 1];
        const setNumber = currentSets.length + 1;

        const sessionExercise = sessionExercises.find(
            (item) => item.id === workoutSessionExerciseId
        );

        const lastWeight = lastSet
            ? editingValues[`${lastSet.id}-weight`] ?? String(lastSet.weight ?? 0)
            : "0";

        const lastReps = lastSet
            ? editingValues[`${lastSet.id}-reps`] ?? String(lastSet.reps ?? 0)
            : "0";

        try {
            await createEmptyWorkoutSet({
                sessionId,
                workoutSessionExerciseId,
                exerciseId: sessionExercise?.exercise_id ?? null,
                exerciseName: sessionExercise?.exercise_name_snapshot ?? "Exercise",
                setNumber,
                reps: Number(lastReps),
                weight: Number(lastWeight),
            });

            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function updateSetValue(
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        updateLocalSetValue(setId, field, value);
    }

    async function toggleSetCompleted(set: WorkoutSessionSet) {
        try {
            await toggleWorkoutSetCompleted({
                setId: set.id,
                isCompleted: set.is_completed,
            });

            await fetchSavedSets();

            const isBeingCompleted = !set.is_completed;

            if (isBeingCompleted) {
                const routineExercise = routineExercises.find(
                    (item) => item.exercise_id === set.exercise_id
                );

                const restSeconds = routineExercise?.rest_seconds ?? 90;

                setTimer(restSeconds);
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
        try {
            await syncWorkoutSessionToRoutine({
                routineId,
                sessionExercises,
                savedSets,
                editingValues,
            });

            await finishWorkoutSession({
                sessionId,
                routineName,
            });

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

    function startTimer(seconds?: number) {
        if (seconds) {
            setTimer(seconds);
        }

        setTimerRunning(true);
    }

    function pauseTimer() {
        setTimerRunning(false);
    }

    function resetTimer() {
        setTimer(0);
        setTimerRunning(false);
    }

    async function deleteSessionExercise(workoutSessionExerciseId: string) {
        try {
            await deleteWorkoutSessionExercise(workoutSessionExerciseId);
            await fetchSessionExercises();
            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    return {
        sessionExercises,
        savedSets,
        timer,
        timerRunning,

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
        deleteSessionExercise,
    };
}