import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "../context/AuthContext";
import {
    createRoutineExerciseSets,
    deleteRoutineById,
    deleteRoutineExercise as deleteRoutineExerciseService,
    getRoutineExercises,
    getRoutineExerciseSetsByRoutineId,
    updateRoutine,
    updateRoutineExerciseConfig,
    updateRoutineExercisePosition,
} from "../services/routineService";
import {
    createWorkoutSession,
    deleteRoutineExerciseSetsByRoutineExerciseId,
    getActiveWorkoutSession,
    getOrCreateWorkoutAfterDiscard,
} from "../services/workoutService";
import { useRoutineEditorStore } from "../store/routineEditorStore";
import type { RoutineExercise, RoutineExerciseSet } from "../types/routine";

type Params = {
    routineId: string;
    routineName: string;
    navigation: any;
};

type ActiveWorkout = {
    id: string;
    routine_id: string;
    started_at: string;
    routines?:
        | {
              name?: string | null;
          }
        | {
              name?: string | null;
          }[]
        | null;
};

export function useRoutineDetail({ routineId, routineName, navigation }: Params) {
    const { user } = useAuth();

    const editorRoutineId = useRoutineEditorStore((state) => state.routineId);
    const name = useRoutineEditorStore((state) => state.name);

    const exercises = useRoutineEditorStore((state) => state.exercises);
    const setsByExerciseId = useRoutineEditorStore((state) => state.setsByExerciseId);
    const editingValues = useRoutineEditorStore((state) => state.editingValues);
    const originalSnapshot = useRoutineEditorStore((state) => state.originalSnapshot);
    const hasUnsavedChanges = useRoutineEditorStore((state) => state.hasUnsavedChanges);

    const initializeEditor = useRoutineEditorStore((state) => state.initializeEditor);
    const setName = useRoutineEditorStore((state) => state.setName);

    const reorderExercises = useRoutineEditorStore((state) => state.reorderExercises);
    const deleteExercise = useRoutineEditorStore((state) => state.deleteExercise);

    const addSet = useRoutineEditorStore((state) => state.addSet);
    const updateSet = useRoutineEditorStore((state) => state.updateSet);
    const deleteSet = useRoutineEditorStore((state) => state.deleteSet);
    const updateEditingValue = useRoutineEditorStore((state) => state.updateEditingValue);
    const updateStoreSetRest = useRoutineEditorStore((state) => state.updateSetRest);
    const updateStoreExerciseRest = useRoutineEditorStore((state) => state.updateExerciseRest);

    const markSaved = useRoutineEditorStore((state) => state.markSaved);
    const discardChanges = useRoutineEditorStore((state) => state.discardChanges);
    const clearEditor = useRoutineEditorStore((state) => state.clearEditor);

    const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
    const [isSavingRoutine, setIsSavingRoutine] = useState(false);
    const [isStartingWorkout, setIsStartingWorkout] = useState(false);

    const [openExerciseMenuId, setOpenExerciseMenuId] = useState<string | null>(null);

    const [activeWorkoutModalVisible, setActiveWorkoutModalVisible] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const fetchRoutine = useCallback(
        async (options?: { force?: boolean }) => {
            const force = options?.force ?? false;
            const editorAlreadyInitialized = editorRoutineId === routineId;

            if (editorAlreadyInitialized && hasUnsavedChanges && !force) {
                return;
            }

            setIsLoadingRoutine(true);

            try {
                const [routineExercises, routineExerciseSets] = await Promise.all([
                    getRoutineExercises(routineId),
                    getRoutineExerciseSetsByRoutineId(routineId),
                ]);

                initializeEditor({
                    routineId,
                    name: routineName,
                    exercises: routineExercises,
                    setsByExerciseId: routineExerciseSets,
                });
            } catch (error: any) {
                Alert.alert("Error", error.message);
            } finally {
                setIsLoadingRoutine(false);
            }
        },
        [editorRoutineId, hasUnsavedChanges, initializeEditor, routineId, routineName]
    );

    useFocusEffect(
        useCallback(() => {
            void fetchRoutine();
        }, [fetchRoutine])
    );

    function reorderRoutineExercises(reorderedExercises: RoutineExercise[]) {
        reorderExercises(reorderedExercises);
    }

    function deleteRoutineExercise(routineExerciseId: string) {
        deleteExercise(routineExerciseId);
        setOpenExerciseMenuId(null);
    }

    function updateLocalTemplateSetValue(setId: string, field: "weight" | "reps", value: string) {
        updateEditingValue(setId, field, value);
    }

    function updateTemplateSet(
        routineExerciseId: string,
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        const normalizedValue = value.trim() === "" ? 0 : Number(value);

        if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
            Alert.alert("Validation", "Please enter a valid positive number");
            return;
        }

        updateEditingValue(setId, field, value);

        updateSet({
            routineExerciseId,
            setId,
            changes: {
                [field]: normalizedValue,
            },
        });
    }

    function addTemplateSet(routineExerciseId: string) {
        const currentSets = setsByExerciseId[routineExerciseId] ?? [];
        const lastSet = currentSets[currentSets.length - 1];

        const lastWeight = lastSet ? getSetDraftValue(lastSet, "weight") : 0;

        const lastReps = lastSet ? getSetDraftValue(lastSet, "reps") : 0;

        const temporarySet: RoutineExerciseSet = {
            id: createTemporaryId(),
            routine_exercise_id: routineExerciseId,
            reps: lastReps,
            weight: lastWeight,
            is_pr: false,
            created_at: new Date().toISOString(),
        };

        addSet(routineExerciseId, temporarySet);
    }

    function deleteTemplateSet(routineExerciseId: string, setId: string) {
        deleteSet(routineExerciseId, setId);
    }

    function updateSetRest(routineExerciseId: string, value: number) {
        updateStoreSetRest(routineExerciseId, value);
    }

    function updateExerciseRest(routineExerciseId: string, value: number) {
        updateStoreExerciseRest(routineExerciseId, value);
    }

    function getSetDraftValue(routineSet: RoutineExerciseSet, field: "weight" | "reps"): number {
        const draftValue = editingValues[`${field}:${routineSet.id}`];

        if (draftValue === undefined || draftValue.trim() === "") {
            return Number(routineSet[field] ?? 0);
        }

        const numericValue = Number(draftValue);

        return Number.isFinite(numericValue) ? numericValue : Number(routineSet[field] ?? 0);
    }

    async function persistDeletedExercises() {
        const originalExercises = originalSnapshot?.exercises ?? [];
        const currentExerciseIds = new Set(exercises.map((exercise) => exercise.id));

        const deletedExercises = originalExercises.filter(
            (exercise) => !currentExerciseIds.has(exercise.id)
        );

        for (const deletedExercise of deletedExercises) {
            await deleteRoutineExerciseSetsByRoutineExerciseId(deletedExercise.id);
            await deleteRoutineExerciseService(deletedExercise.id);
        }
    }

    async function persistRoutineExercises() {
        await persistDeletedExercises();

        await Promise.all(
            exercises.map((routineExercise, index) =>
                updateRoutineExercisePosition({
                    routineExerciseId: routineExercise.id,
                    position: index,
                })
            )
        );

        for (const routineExercise of exercises) {
            await updateRoutineExerciseConfig({
                routineExerciseId: routineExercise.id,
                restSeconds: routineExercise.rest_seconds ?? 90,
                exerciseRestSeconds: routineExercise.exercise_rest_seconds ?? 120,
            });

            await deleteRoutineExerciseSetsByRoutineExerciseId(routineExercise.id);

            const currentSets = setsByExerciseId[routineExercise.id] ?? [];

            const setsToInsert = currentSets.map((routineSet) => ({
                routine_exercise_id: routineExercise.id,
                reps: getSetDraftValue(routineSet, "reps"),
                weight: getSetDraftValue(routineSet, "weight"),
            }));

            await createRoutineExerciseSets(setsToInsert);
        }
    }

    async function saveRoutineChanges(): Promise<boolean> {
        const normalizedName = name.trim();

        if (!normalizedName) {
            Alert.alert("Validation", "Routine name is required");
            return false;
        }

        if (!hasUnsavedChanges || isSavingRoutine) {
            return true;
        }

        setIsSavingRoutine(true);

        try {
            await updateRoutine({
                routineId,
                name: normalizedName,
            });

            await persistRoutineExercises();

            /*
             * Keep the Store values normalized before creating the new
             * original snapshot.
             */
            if (normalizedName !== name) {
                setName(normalizedName);
            }

            markSaved();

            return true;
        } catch (error: any) {
            Alert.alert("Error", error.message);
            return false;
        } finally {
            setIsSavingRoutine(false);
        }
    }

    async function deleteRoutine() {
        try {
            await deleteRoutineById(routineId);
            clearEditor();
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function startWorkout() {
        if (hasUnsavedChanges) {
            Alert.alert(
                "Unsaved changes",
                "Save your routine changes before starting the workout."
            );
            return;
        }

        if (!user) {
            Alert.alert("Error", "User not found");
            return;
        }

        if (isStartingWorkout) {
            return;
        }

        setIsStartingWorkout(true);

        try {
            const currentActiveWorkout = await getActiveWorkoutSession(user.id);

            if (currentActiveWorkout) {
                setActiveWorkout(currentActiveWorkout);
                setActiveWorkoutModalVisible(true);
                return;
            }

            const session = await createWorkoutSession({
                userId: user.id,
                routineId,
            });

            navigation.navigate("WorkoutSession", {
                sessionId: session.id,
                routineId,
                routineName: name,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsStartingWorkout(false);
        }
    }

    function getActiveRoutineName(workout: ActiveWorkout) {
        if (Array.isArray(workout.routines)) {
            return workout.routines[0]?.name;
        }

        return workout.routines?.name;
    }

    function getElapsedText(startedAt: string) {
        const startedAtTimestamp = new Date(startedAt).getTime();

        if (!Number.isFinite(startedAtTimestamp)) {
            return "0m";
        }

        const elapsedMilliseconds = Math.max(0, now - startedAtTimestamp);
        const totalMinutes = Math.floor(elapsedMilliseconds / 60_000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }

        return `${totalMinutes}m`;
    }

    function resumeActiveWorkout() {
        if (!activeWorkout) {
            return;
        }

        setActiveWorkoutModalVisible(false);

        navigation.navigate("WorkoutSession", {
            sessionId: activeWorkout.id,
            routineId: activeWorkout.routine_id,
            routineName: getActiveRoutineName(activeWorkout) ?? "Workout",
        });
    }

    async function discardAndStartWorkout() {
        if (!user || !activeWorkout || isStartingWorkout) {
            return;
        }

        setIsStartingWorkout(true);

        try {
            setActiveWorkoutModalVisible(false);

            const session = await getOrCreateWorkoutAfterDiscard({
                userId: user.id,
                routineId,
                activeSessionId: activeWorkout.id,
            });

            navigation.navigate("WorkoutSession", {
                sessionId: session.id,
                routineId,
                routineName: name,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsStartingWorkout(false);
        }
    }

    return {
        routineTitle: name,
        routineExercises: exercises,
        routineExerciseSets: setsByExerciseId,

        hasUnsavedChanges,
        isLoadingRoutine,
        isSavingRoutine,
        isStartingWorkout,

        setRoutineName: setName,
        reorderRoutineExercises,
        deleteRoutineExercise,

        updateTemplateSet,
        addTemplateSet,
        deleteTemplateSet,
        updateLocalTemplateSetValue,

        updateSetRest,
        updateExerciseRest,

        saveRoutineChanges,
        discardRoutineChanges: discardChanges,
        reloadRoutine: () => fetchRoutine({ force: true }),

        deleteRoutine,
        startWorkout,

        activeWorkoutModalVisible,
        activeWorkoutRoutineName: activeWorkout
            ? (getActiveRoutineName(activeWorkout) ?? "Workout")
            : "Workout",
        activeWorkoutElapsedText: activeWorkout
            ? getElapsedText(activeWorkout.started_at)
            : undefined,
        setActiveWorkoutModalVisible,
        resumeActiveWorkout,
        discardAndStartWorkout,

        openExerciseMenuId,
        setOpenExerciseMenuId,
    };
}

function createTemporaryId() {
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
