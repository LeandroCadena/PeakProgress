import { useFocusEffect } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";

import { useAuth } from "../context/AuthContext";
import { getUserSettings } from "../services/settingsService";
import { loadWorkoutSessionSnapshot } from "../services/workoutService";
import { syncCompletedWorkout } from "../services/workoutSyncService";
import { useWorkoutSessionStore } from "../store/workoutSessionStore";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../types/workout";
import {
    scheduleRestFinishedNotification,
    cancelRestFinishedNotification,
} from "../utils/notifications";
import { playPersonalRecordSound, playTimerFinishedSound } from "../utils/sounds";

type WorkoutFinishResult = {
    updateRoutineAfterWorkout: boolean;
};

type Params = {
    sessionId: string;
    routineId: string;
    routineName: string;
    onFinish: (result: WorkoutFinishResult) => void;
};

export function useWorkoutSession({ sessionId, routineId, routineName, onFinish }: Params) {
    const { user } = useAuth();

    const storedSessionId = useWorkoutSessionStore((state) => state.sessionId);
    const storedRoutineId = useWorkoutSessionStore((state) => state.routineId);
    const hasHydrated = useWorkoutSessionStore((state) => state.hasHydrated);
    const initializeLocalSession = useWorkoutSessionStore((state) => state.initializeSession);
    const clearStoredSession = useWorkoutSessionStore((state) => state.clearSession);
    const setSessionSyncing = useWorkoutSessionStore((state) => state.setSyncing);
    const setSessionSyncSuccess = useWorkoutSessionStore((state) => state.setSyncSuccess);
    const setSessionSyncError = useWorkoutSessionStore((state) => state.setSyncError);

    const setStoredRestTimer = useWorkoutSessionStore((state) => state.setRestTimer);
    const storedRestTimerEndAt = useWorkoutSessionStore((state) => state.restTimerEndAt);
    const storedLastTimerDuration = useWorkoutSessionStore((state) => state.lastTimerDuration);

    const editingValues = useWorkoutSessionStore((state) => state.editingValues);
    const updateStoredEditingValue = useWorkoutSessionStore((state) => state.updateEditingValue);

    const savedSets = useWorkoutSessionStore((state) => state.savedSets);
    const replaceStoredSavedSets = useWorkoutSessionStore((state) => state.replaceSavedSets);
    const addStoredSet = useWorkoutSessionStore((state) => state.addSet);
    const updateStoredSet = useWorkoutSessionStore((state) => state.updateSet);
    const deleteStoredSet = useWorkoutSessionStore((state) => state.deleteSet);

    const sessionExercises = useWorkoutSessionStore((state) => state.sessionExercises);
    const deleteStoredExercise = useWorkoutSessionStore((state) => state.deleteExercise);
    const replaceStoredSessionExercises = useWorkoutSessionStore(
        (state) => state.replaceSessionExercises
    );

    const [isInitializingSession, setIsInitializingSession] = useState(true);
    const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [lastTimerDuration, setLastTimerDuration] = useState(0);
    const [restEndAt, setRestEndAt] = useState<number | null>(null);
    const [useGlobalTimers, setUseGlobalTimers] = useState(false);
    const [isRoutineMenuOpen, setIsRoutineMenuOpen] = useState(false);
    const timerVersionRef = useRef(0);
    const isScreenFocusedRef = useRef(false);
    const hasFinishedRef = useRef(false);

    const ensureWorkoutSessionInitialized = useCallback(async () => {
        if (hasFinishedRef.current || !hasHydrated || !user?.id || !sessionId || !routineId) {
            return;
        }

        setIsInitializingSession(true);

        try {
            const hasStoredSession =
                storedSessionId === sessionId &&
                storedRoutineId === routineId &&
                sessionExercises.length > 0;

            if (hasStoredSession) {
                if (storedRestTimerEndAt) {
                    const endAt = new Date(storedRestTimerEndAt).getTime();

                    const remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

                    setRestEndAt(remainingSeconds > 0 ? endAt : null);
                    setTimer(remainingSeconds);
                    setTimerRunning(remainingSeconds > 0);
                } else {
                    setRestEndAt(null);
                    setTimer(0);
                    setTimerRunning(false);
                }

                setLastTimerDuration(storedLastTimerDuration);

                return;
            }

            const snapshot = await loadWorkoutSessionSnapshot({
                sessionId,
                routineId,
                userId: user.id,
            });

            initializeLocalSession({
                sessionId,
                routineId,
                routineName,
                sessionExercises: snapshot.sessionExercises,
                savedSets: snapshot.savedSets,
                restTimerEndAt: snapshot.restTimerEndAt,
                lastTimerDuration: snapshot.lastTimerDuration,
            });

            if (snapshot.restTimerEndAt) {
                const endAt = new Date(snapshot.restTimerEndAt).getTime();

                const remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

                setRestEndAt(remainingSeconds > 0 ? endAt : null);
                setTimer(remainingSeconds);
                setTimerRunning(remainingSeconds > 0);
            } else {
                setRestEndAt(null);
                setTimer(0);
                setTimerRunning(false);
            }

            setLastTimerDuration(snapshot.lastTimerDuration);
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Unable to initialize workout session";

            Alert.alert("Error", message);
        } finally {
            setIsInitializingSession(false);
        }
    }, [
        hasHydrated,
        initializeLocalSession,
        routineId,
        routineName,
        sessionExercises.length,
        sessionId,
        storedLastTimerDuration,
        storedRestTimerEndAt,
        storedRoutineId,
        storedSessionId,
        user?.id,
    ]);

    const fetchUserSettings = useCallback(async () => {
        if (!user?.id) return;

        const settings = await getUserSettings(user.id);
        setUseGlobalTimers(settings.use_global_timers);
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            isScreenFocusedRef.current = true;

            ensureWorkoutSessionInitialized();
            fetchUserSettings();

            return () => {
                isScreenFocusedRef.current = false;
            };
        }, [ensureWorkoutSessionInitialized, fetchUserSettings])
    );

    useEffect(() => {
        if (!timerRunning || !restEndAt) return;

        const intervalId = setInterval(async () => {
            const remainingSeconds = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));

            setTimer(remainingSeconds);

            if (remainingSeconds <= 0) {
                setTimerRunning(false);
                setRestEndAt(null);

                setStoredRestTimer({
                    restTimerEndAt: null,
                    lastTimerDuration,
                });

                const hadPendingNotification = await cancelRestFinishedNotification();

                if (isScreenFocusedRef.current && hadPendingNotification) {
                    playTimerFinishedSound();
                }
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timerRunning, restEndAt, lastTimerDuration, sessionId, setStoredRestTimer]);

    const syncTimerWithRestEndAt = useCallback(() => {
        if (!restEndAt) return;

        const remainingSeconds = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));

        setTimer(remainingSeconds);

        if (remainingSeconds <= 0) {
            setTimerRunning(false);
            setRestEndAt(null);
            cancelRestFinishedNotification();
        }
    }, [restEndAt]);

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

    function addEmptySet(workoutSessionExerciseId: string) {
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

        const newSet: WorkoutSessionSet = {
            id: Crypto.randomUUID(),
            workout_session_exercise_id: workoutSessionExerciseId,
            exercise_id: sessionExercise?.exercise_id ?? null,
            reps,
            weight,
            is_completed: false,
            is_pr: false,
            created_at: new Date().toISOString(),
        };

        addStoredSet(workoutSessionExerciseId, newSet);
    }

    function updateSetValue(setId: string, field: "weight" | "reps", value: string) {
        updateLocalSetValue(setId, field, value);

        const workoutSessionExerciseId = Object.keys(savedSets).find((exerciseId) =>
            savedSets[exerciseId]?.some((workoutSet) => workoutSet.id === setId)
        );

        if (workoutSessionExerciseId) {
            updateStoredSet({
                workoutSessionExerciseId,
                setId,
                changes: {
                    [field]: Number(value || 0),
                },
            });
        }
    }

    async function toggleSetCompleted(
        workoutSessionExerciseId: string,
        workoutSet: WorkoutSessionSet
    ) {
        const nextCompletedValue = !workoutSet.is_completed;

        const { weight, reps } = getCurrentSetValues(workoutSet);

        const isPr = calculateIsPersonalRecord({
            workoutSessionExerciseId,
            weight,
            reps,
        });

        updateStoredSet({
            workoutSessionExerciseId,
            setId: workoutSet.id,
            changes: {
                weight,
                reps,
                is_pr: isPr,
                is_completed: nextCompletedValue,
            },
        });

        if (nextCompletedValue && isPr) {
            playPersonalRecordSound();
        }

        if (nextCompletedValue) {
            const restSeconds = getRestSecondsAfterSet({
                workoutSessionExerciseId,
                setId: workoutSet.id,
            });

            if (restSeconds > 0) {
                await startRestTimer(restSeconds);
            }
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

        setStoredRestTimer({
            restTimerEndAt: endAtIso,
            lastTimerDuration: restSeconds,
        });

        await cancelRestFinishedNotification();

        if (currentVersion !== timerVersionRef.current) return;

        await scheduleRestFinishedNotification(restSeconds);
    }

    function restartLastTimer() {
        if (lastTimerDuration <= 0) return;

        startRestTimer(lastTimerDuration);
    }

    function deleteSet(setId: string) {
        const workoutSessionExerciseId = Object.keys(savedSets).find((exerciseId) =>
            savedSets[exerciseId]?.some((workoutSet) => workoutSet.id === setId)
        );

        if (!workoutSessionExerciseId) {
            return;
        }

        deleteStoredSet(workoutSessionExerciseId, setId);
    }

    async function finishWorkout() {
        if (isFinishingWorkout) return;

        setIsFinishingWorkout(true);

        try {
            const normalizedSavedSets = getNormalizedSavedSets();

            replaceStoredSavedSets(normalizedSavedSets);

            setSessionSyncing();

            await syncCompletedWorkout({
                sessionId,
                routineName,
                userId: user?.id ?? null,
                sessionExercises,
                savedSets: normalizedSavedSets,
            });

            let updateRoutineAfterWorkout = true;

            if (user?.id) {
                try {
                    const settings = await getUserSettings(user.id);

                    updateRoutineAfterWorkout = settings.update_routine_after_workout;
                } catch (settingsError) {
                    console.log("Unable to read workout update preference", settingsError);
                }
            }

            setSessionSyncSuccess();

            hasFinishedRef.current = true;
            clearStoredSession();

            onFinish({
                updateRoutineAfterWorkout,
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Unable to synchronize workout";

            setSessionSyncError(message);

            Alert.alert("Error finishing workout", message);
        } finally {
            setIsFinishingWorkout(false);
        }
    }

    function getSetInputValue(setId: string, field: "weight" | "reps", value: number | null) {
        const key = `${setId}-${field}`;
        return editingValues[key] ?? String(value ?? 0);
    }

    function updateLocalSetValue(setId: string, field: "weight" | "reps", value: string) {
        updateStoredEditingValue(setId, field, value);
    }

    function deleteSessionExercise(workoutSessionExerciseId: string) {
        deleteStoredExercise(workoutSessionExerciseId);
    }

    function reorderSessionExercises(reorderedExercises: WorkoutSessionExercise[]) {
        const exercisesWithPositions = reorderedExercises.map((exercise, index) => ({
            ...exercise,
            position: index,
        }));

        replaceStoredSessionExercises(exercisesWithPositions);
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

    function updateWorkoutSetRest(workoutSessionExerciseId: string, value: number) {
        replaceStoredSessionExercises(
            sessionExercises.map((exercise) =>
                exercise.id === workoutSessionExerciseId
                    ? { ...exercise, rest_seconds: value }
                    : exercise
            )
        );
    }

    function updateWorkoutExerciseRest(workoutSessionExerciseId: string, value: number) {
        replaceStoredSessionExercises(
            sessionExercises.map((exercise) =>
                exercise.id === workoutSessionExerciseId
                    ? { ...exercise, exercise_rest_seconds: value }
                    : exercise
            )
        );
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

    function getNormalizedSavedSets() {
        return Object.fromEntries(
            Object.entries(savedSets).map(([workoutSessionExerciseId, sets]) => [
                workoutSessionExerciseId,
                sets.map((workoutSet) => ({
                    ...workoutSet,
                    weight: Number(
                        editingValues[`${workoutSet.id}-weight`] ?? workoutSet.weight ?? 0
                    ),
                    reps: Number(editingValues[`${workoutSet.id}-reps`] ?? workoutSet.reps ?? 0),
                })),
            ])
        );
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
        reorderSessionExercises,

        lastTimerDuration,
        restartLastTimer,
        useGlobalTimers,

        isRoutineMenuOpen,
        setIsRoutineMenuOpen,
    };
}
