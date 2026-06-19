import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";
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
    const [sessionExercises, setSessionExercises] = useState<WorkoutSessionExercise[]>([]);
    const [savedSets, setSavedSets] = useState<Record<string, WorkoutSessionSet[]>>({});
    const [editingValues, setEditingValues] = useState<Record<string, string>>({});
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [lastTimerDuration, setLastTimerDuration] = useState(0);

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

    async function toggleSetCompleted(
        workoutSessionExerciseId: string,
        set: WorkoutSessionSet
    ) {
        try {
            await toggleWorkoutSetCompleted({
                setId: set.id,
                isCompleted: set.is_completed,
            });

            await fetchSavedSets();

            const nextCompletedValue = !set.is_completed;

            if (nextCompletedValue) {
                const restSeconds = getRestSecondsAfterSet({
                    workoutSessionExerciseId,
                    setId: set.id,
                });

                if (restSeconds > 0) {
                    setLastTimerDuration(restSeconds);
                    setTimer(restSeconds);
                    setTimerRunning(true);
                }
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function restartLastTimer() {
        if (lastTimerDuration <= 0) return;

        setTimer(lastTimerDuration);
        setTimerRunning(true);
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

    async function deleteSessionExercise(workoutSessionExerciseId: string) {
        try {
            await deleteWorkoutSessionExercise(workoutSessionExerciseId);
            await fetchSessionExercises();
            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function getRestSecondsAfterSet(params: {
        workoutSessionExerciseId: string;
        setId: string;
    }) {
        const exerciseIndex = sessionExercises.findIndex(
            (exercise) => exercise.id === params.workoutSessionExerciseId
        );

        const exercise = sessionExercises[exerciseIndex];
        if (!exercise) return 0;

        const sets = savedSets[params.workoutSessionExerciseId] ?? [];
        const currentSetIndex = sets.findIndex((set) => set.id === params.setId);

        const hasMoreSetsInExercise = currentSetIndex < sets.length - 1;
        const hasNextExercise = exerciseIndex < sessionExercises.length - 1;

        if (hasMoreSetsInExercise) {
            return exercise.rest_seconds ?? 90;
        }

        if (hasNextExercise) {
            return exercise.exercise_rest_seconds ?? 120;
        }

        return 0;
    }

    function updateWorkoutSetRest(
        workoutSessionExerciseId: string,
        value: number
    ) {
        setSessionExercises((prev) =>
            prev.map((exercise) =>
                exercise.id === workoutSessionExerciseId
                    ? { ...exercise, rest_seconds: value }
                    : exercise
            )
        );
    }

    function updateWorkoutExerciseRest(
        workoutSessionExerciseId: string,
        value: number
    ) {
        setSessionExercises((prev) =>
            prev.map((exercise) =>
                exercise.id === workoutSessionExerciseId
                    ? { ...exercise, exercise_rest_seconds: value }
                    : exercise
            )
        );
    }

    return {
        sessionExercises,
        savedSets,
        timer,
        timerRunning,

        addEmptySet,
        updateSetValue,
        toggleSetCompleted,
        deleteSet,
        finishWorkout,
        getSetInputValue,
        updateLocalSetValue,
        deleteSessionExercise,

        getRestSecondsAfterSet,
        updateWorkoutSetRest,
        updateWorkoutExerciseRest,

        lastTimerDuration,
        restartLastTimer,
    };
}