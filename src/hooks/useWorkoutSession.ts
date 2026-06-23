import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";

import { useAuth } from "../context/AuthContext";
import { upsertUserExerciseRecord } from "../services/progressService";
import { getUserSettings } from "../services/settingsService";
import { updateWorkoutStreakAfterFinish } from "../services/streakService";
import {
    getSavedSets,
    createEmptyWorkoutSet,
    toggleWorkoutSetCompleted,
    deleteWorkoutSet,
    finishWorkoutSession,
    syncWorkoutSessionToRoutine,
    getWorkoutSessionExercises,
    deleteWorkoutSessionExercise,
    updateWorkoutSessionExerciseRest,
    getWorkoutSessionTimer,
    updateWorkoutSessionTimer,
    updateWorkoutSetValues,
    updateWorkoutSetValue,
    createWorkoutSessionExercisesFromRoutine,
} from "../services/workoutService";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";
import {
    scheduleRestFinishedNotification,
    cancelRestFinishedNotification,
} from "../utils/notifications";
import { playPersonalRecordSound, playTimerFinishedSound } from "../utils/sounds";

type Params = {
    sessionId: string;
    routineId: string;
    routineName: string;
    onFinish: () => void;
};

export function useWorkoutSession({ sessionId, routineId, routineName, onFinish }: Params) {
    const { user } = useAuth();

    const [sessionExercises, setSessionExercises] = useState<WorkoutSessionExercise[]>([]);
    const [savedSets, setSavedSets] = useState<Record<string, WorkoutSessionSet[]>>({});
    const [editingValues, setEditingValues] = useState<Record<string, string>>({});
    const [isInitializingSession, setIsInitializingSession] = useState(true);
    const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [lastTimerDuration, setLastTimerDuration] = useState(0);
    const [restEndAt, setRestEndAt] = useState<number | null>(null);
    const [useGlobalTimers, setUseGlobalTimers] = useState(false);
    const timerVersionRef = useRef(0);
    const isScreenFocusedRef = useRef(false);

    const ensureWorkoutSessionInitialized = useCallback(async () => {
        if (!user?.id || !sessionId || !routineId) return;

        setIsInitializingSession(true);

        try {
            const exercises = await getWorkoutSessionExercises(sessionId);

            if (exercises.length > 0) {
                setSessionExercises(exercises);

                const existingSets = await getSavedSets(sessionId);
                setSavedSets(existingSets);

                return;
            }

            const createdExercises = await createWorkoutSessionExercisesFromRoutine({
                sessionId,
                routineId,
                userId: user.id,
            });

            setSessionExercises(createdExercises);

            const createdSets = await getSavedSets(sessionId);
            setSavedSets(createdSets);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsInitializingSession(false);
        }
    }, [routineId, sessionId, user?.id])

    const fetchSavedSets = useCallback(async () => {
        try {
            const data = await getSavedSets(sessionId);
            setSavedSets(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [sessionId])

    const fetchWorkoutSessionTimer = useCallback(async () => {
        const data = await getWorkoutSessionTimer(sessionId);

        setLastTimerDuration(data.last_rest_duration_seconds ?? 0);

        if (!data.rest_timer_end_at) {
            setTimer(0);
            setTimerRunning(false);
            setRestEndAt(null);
            return;
        }

        const endAt = new Date(data.rest_timer_end_at).getTime();

        const remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

        setRestEndAt(remainingSeconds > 0 ? endAt : null);
        setTimer(remainingSeconds);
        setTimerRunning(remainingSeconds > 0);
    }, [sessionId])

    const fetchUserSettings = useCallback(async () => {
        if (!user?.id) return;

        const settings = await getUserSettings(user.id);
        setUseGlobalTimers(settings.use_global_timers);
    }, [user?.id])

    useFocusEffect(
        useCallback(() => {
            isScreenFocusedRef.current = true;

            ensureWorkoutSessionInitialized();
            fetchSavedSets();
            fetchWorkoutSessionTimer();
            fetchUserSettings();

            return () => {
                isScreenFocusedRef.current = false;
            };
        }, [ensureWorkoutSessionInitialized, fetchSavedSets, fetchWorkoutSessionTimer, fetchUserSettings])
    );

    useEffect(() => {
        if (!timerRunning || !restEndAt) return;

        const intervalId = setInterval(async () => {
            const remainingSeconds = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));

            setTimer(remainingSeconds);

            if (remainingSeconds <= 0) {
                setTimerRunning(false);
                setRestEndAt(null);

                await updateWorkoutSessionTimer({
                    sessionId,
                    restTimerEndAt: null,
                    lastRestDurationSeconds: lastTimerDuration,
                });

                const hadPendingNotification = await cancelRestFinishedNotification();

                if (isScreenFocusedRef.current && hadPendingNotification) {
                    playTimerFinishedSound();
                }
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timerRunning, restEndAt, lastTimerDuration, sessionId]);

    const syncTimerWithRestEndAt = useCallback(() => {
        if (!restEndAt) return;

        const remainingSeconds = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));

        setTimer(remainingSeconds);

        if (remainingSeconds <= 0) {
            setTimerRunning(false);
            setRestEndAt(null);
            cancelRestFinishedNotification();
        }
    }, [restEndAt])

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                syncTimerWithRestEndAt();
            }
        });

        return () => subscription.remove();
    }, [restEndAt, syncTimerWithRestEndAt]);

    useFocusEffect(
        useCallback(() => {
            syncTimerWithRestEndAt();
        }, [syncTimerWithRestEndAt])
    );

    async function fetchSessionExercises() {
        try {
            const data = await getWorkoutSessionExercises(sessionId);
            setSessionExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function addEmptySet(workoutSessionExerciseId: string) {
        const currentSets = savedSets[workoutSessionExerciseId] ?? [];
        const lastSet = currentSets[currentSets.length - 1];

        const sessionExercise = sessionExercises.find(
            (item) => item.id === workoutSessionExerciseId
        );

        const reps = Number(
            lastSet ? (editingValues[`${lastSet.id}-reps`] ?? lastSet.reps ?? 0) : 0
        );

        const weight = Number(
            lastSet ? (editingValues[`${lastSet.id}-weight`] ?? lastSet.weight ?? 0) : 0
        );

        const tempId = `temp-${Date.now()}`;
        const createdAt = new Date().toISOString();

        const tempSet: WorkoutSessionSet = {
            id: tempId,
            workout_session_exercise_id: workoutSessionExerciseId,
            exercise_id: sessionExercise?.exercise_id ?? null,
            reps,
            weight,
            is_completed: false,
            is_pr: false,
            created_at: createdAt,
        };

        setSavedSets((prev) => ({
            ...prev,
            [workoutSessionExerciseId]: [...(prev[workoutSessionExerciseId] ?? []), tempSet],
        }));

        try {
            const createdSet = await createEmptyWorkoutSet({
                sessionId,
                workoutSessionExerciseId,
                exerciseId: sessionExercise?.exercise_id ?? null,
                exerciseName: sessionExercise?.exercise_name_snapshot ?? "Exercise",
                reps,
                weight,
            });

            setSavedSets((prev) => ({
                ...prev,
                [workoutSessionExerciseId]: (prev[workoutSessionExerciseId] ?? []).map((set) =>
                    set.id === tempId ? createdSet : set
                ),
            }));
        } catch (error: any) {
            setSavedSets((prev) => ({
                ...prev,
                [workoutSessionExerciseId]: (prev[workoutSessionExerciseId] ?? []).filter(
                    (set) => set.id !== tempId
                ),
            }));

            Alert.alert("Error", error.message);
        }
    }

    async function updateSetValue(setId: string, field: "weight" | "reps", value: string) {
        updateLocalSetValue(setId, field, value);

        await updateWorkoutSetValue({
            setId,
            field,
            value: Number(value || 0),
        });
    }

    async function toggleSetCompleted(workoutSessionExerciseId: string, set: WorkoutSessionSet) {
        const nextCompletedValue = !set.is_completed;
        const previousSets = savedSets;

        const { weight, reps } = getCurrentSetValues(set);

        const isPr = calculateIsPersonalRecord({
            workoutSessionExerciseId,
            weight,
            reps,
        });

        setSavedSets((prev) => ({
            ...prev,
            [workoutSessionExerciseId]: (prev[workoutSessionExerciseId] ?? []).map((currentSet) =>
                currentSet.id === set.id
                    ? {
                        ...currentSet,
                        weight,
                        reps,
                        is_pr: isPr,
                        is_completed: nextCompletedValue,
                    }
                    : currentSet
            ),
        }));

        try {
            await updateWorkoutSetValues({
                setId: set.id,
                weight,
                reps,
                isPr,
            });

            await toggleWorkoutSetCompleted({
                setId: set.id,
                isCompleted: set.is_completed,
            });

            if (nextCompletedValue && isPr) {
                playPersonalRecordSound();
            }

            if (nextCompletedValue) {
                const restSeconds = getRestSecondsAfterSet({
                    workoutSessionExerciseId,
                    setId: set.id,
                });

                if (restSeconds > 0) {
                    await startRestTimer(restSeconds);
                }
            }
        } catch (error: any) {
            setSavedSets(previousSets);
            Alert.alert("Error", error.message);
        }
    }

    async function startRestTimer(restSeconds: number) {
        timerVersionRef.current += 1;
        const currentVersion = timerVersionRef.current;

        const endAt = Date.now() + restSeconds * 1000;
        const endAtIso = new Date(endAt).toISOString();

        setLastTimerDuration(restSeconds);
        setRestEndAt(endAt);
        setTimer(restSeconds);
        setTimerRunning(true);

        await updateWorkoutSessionTimer({
            sessionId,
            restTimerEndAt: endAtIso,
            lastRestDurationSeconds: restSeconds,
        });

        await cancelRestFinishedNotification();

        if (currentVersion !== timerVersionRef.current) return;

        await scheduleRestFinishedNotification(restSeconds);
    }

    function restartLastTimer() {
        if (lastTimerDuration <= 0) return;

        startRestTimer(lastTimerDuration);
    }

    async function deleteSet(setId: string) {
        const previousSets = savedSets;

        setSavedSets((prev) => {
            const next = { ...prev };

            Object.keys(next).forEach((exerciseId) => {
                next[exerciseId] = next[exerciseId].filter((set) => set.id !== setId);
            });

            return next;
        });

        try {
            await deleteWorkoutSet(setId);
        } catch (error: any) {
            setSavedSets(previousSets);
            Alert.alert("Error", error.message);
        }
    }

    async function finishWorkout() {
        if (isFinishingWorkout) return;

        setIsFinishingWorkout(true);

        try {
            await finishWorkoutSession({
                sessionId,
                routineName,
            });

            await Promise.all([
                syncWorkoutSessionToRoutine({
                    routineId,
                    sessionExercises,
                    savedSets,
                    editingValues,
                }),
                updateUserExerciseRecordsFromWorkout(),
                user?.id ? updateWorkoutStreakAfterFinish(user.id) : Promise.resolve(),
            ]);

            onFinish();
        } catch (error: any) {
            Alert.alert("Error finishing workout", error.message);
        } finally {
            setIsFinishingWorkout(false);
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

    async function deleteSessionExercise(workoutSessionExerciseId: string) {
        try {
            await deleteWorkoutSessionExercise(workoutSessionExerciseId);
            await fetchSessionExercises();
            await fetchSavedSets();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function getRestSecondsAfterSet(params: { workoutSessionExerciseId: string; setId: string }) {
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

    async function updateWorkoutSetRest(workoutSessionExerciseId: string, value: number) {
        setSessionExercises((prev) =>
            prev.map((exercise) =>
                exercise.id === workoutSessionExerciseId
                    ? { ...exercise, rest_seconds: value }
                    : exercise
            )
        );

        try {
            await updateWorkoutSessionExerciseRest({
                workoutSessionExerciseId,
                restSeconds: value,
            });
        } catch (error) {
            console.log("updateWorkoutSetRest error", error);
        }
    }

    async function updateWorkoutExerciseRest(workoutSessionExerciseId: string, value: number) {
        setSessionExercises((prev) =>
            prev.map((exercise) =>
                exercise.id === workoutSessionExerciseId
                    ? { ...exercise, exercise_rest_seconds: value }
                    : exercise
            )
        );

        await updateWorkoutSessionExerciseRest({
            workoutSessionExerciseId,
            exerciseRestSeconds: value,
        });
    }

    function calculateIsPersonalRecord(params: {
        workoutSessionExerciseId: string;
        weight: number;
        reps: number;
    }) {
        const exercise = sessionExercises.find(
            (item) => item.id === params.workoutSessionExerciseId
        );

        const currentPrVolume = Number(exercise?.current_pr_volume ?? 0);
        const currentVolume = params.weight * params.reps;

        return currentVolume > currentPrVolume;
    }

    function getCurrentSetValues(set: WorkoutSessionSet) {
        const weight = Number(editingValues[`${set.id}-weight`] ?? set.weight ?? 0);

        const reps = Number(editingValues[`${set.id}-reps`] ?? set.reps ?? 0);

        return { weight, reps };
    }

    async function updateUserExerciseRecordsFromWorkout() {
        if (!user) return;

        const allSets = Object.values(savedSets).flat();

        const completedPrSets = allSets.filter(
            (set) => set.is_completed && set.is_pr && set.exercise_id
        );

        const bestByExercise: Record<
            string,
            {
                setId: string;
                volume: number;
                weight: number;
                reps: number;
            }
        > = {};

        completedPrSets.forEach((set) => {
            const exerciseId = set.exercise_id!;
            const weight = Number(editingValues[`${set.id}-weight`] ?? set.weight ?? 0);
            const reps = Number(editingValues[`${set.id}-reps`] ?? set.reps ?? 0);
            const volume = weight * reps;

            if (!bestByExercise[exerciseId] || volume > bestByExercise[exerciseId].volume) {
                bestByExercise[exerciseId] = {
                    setId: set.id,
                    volume,
                    weight,
                    reps,
                };
            }
        });

        for (const [exerciseId, record] of Object.entries(bestByExercise)) {
            await upsertUserExerciseRecord({
                userId: user.id,
                exerciseId,
                bestVolume: record.volume,
                bestWeight: record.weight,
                bestReps: record.reps,
                bestSetId: record.setId,
            });
        }
    }

    return {
        sessionExercises,
        isInitializingSession,
        isFinishingWorkout,
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
        updateUserExerciseRecordsFromWorkout,

        lastTimerDuration,
        restartLastTimer,
        useGlobalTimers,
    };
}
