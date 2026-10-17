import { useFocusEffect } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
    getLocalRoutine,
    getLocalRoutineSyncMetadata,
    hydrateLocalRoutine,
    saveLocalRoutine,
} from "../database/repositories/routineRepository";
import { deleteRoutineById } from "../services/routineService";
import { getVersionedRemoteRoutineSnapshot } from "../services/sync/remoteRoutineSnapshotService";
import {
    createWorkoutSession,
    getActiveWorkoutSession,
    getOrCreateWorkoutAfterDiscard,
} from "../services/workoutService";
import type { RoutineEditorSnapshot } from "../store/routineEditorStore";
import { useRoutineEditorStore } from "../store/routineEditorStore";
import { subscribeToRoutineChanges } from "../sync/routineEvents";
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
    const { showToast } = useToast();

    const editorRoutineId = useRoutineEditorStore((state) => state.routineId);
    const name = useRoutineEditorStore((state) => state.name);

    const exercises = useRoutineEditorStore((state) => state.exercises);
    const setsByExerciseId = useRoutineEditorStore((state) => state.setsByExerciseId);
    const editingValues = useRoutineEditorStore((state) => state.editingValues);
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

    const discardChanges = useRoutineEditorStore((state) => state.discardChanges);
    const clearEditor = useRoutineEditorStore((state) => state.clearEditor);

    const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
    const [isSavingRoutine, setIsSavingRoutine] = useState(false);
    const [isStartingWorkout, setIsStartingWorkout] = useState(false);
    const isStartingWorkoutRef = useRef(false);

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

            if (editorRoutineId === routineId && hasUnsavedChanges && !force) {
                return;
            }

            setIsLoadingRoutine(true);

            try {
                if (!user?.id) {
                    throw new Error("You must be signed in to load a routine.");
                }

                const localSnapshot = await getLocalRoutine({
                    userId: user.id,
                    routineId,
                });
                if (localSnapshot) {
                    initializeEditor(localSnapshot);
                    return;
                }

                // A local tombstone must not be resurrected by a remote fallback.
                const localMetadata = await getLocalRoutineSyncMetadata({
                    userId: user.id,
                    routineId,
                });
                if (localMetadata) {
                    throw new Error("This routine is unavailable locally or was deleted.");
                }

                // First access to a legacy remote-only routine: hydrate its
                // versioned snapshot before allowing any local modifications.
                const remote = await getVersionedRemoteRoutineSnapshot({
                    userId: user.id,
                    routineId,
                });
                const hydrated = await hydrateLocalRoutine({
                    userId: user.id,
                    snapshot: remote.snapshot,
                    remoteVersion: remote.remoteVersion,
                });
                if (!hydrated) {
                    // A concurrent local edit or delete may have won the race.
                    const latest = await getLocalRoutine({ userId: user.id, routineId });
                    if (!latest) throw new Error("Routine changed during hydration.");
                    initializeEditor(latest);
                    return;
                }
                initializeEditor(remote.snapshot);
            } catch (error) {
                showToast({
                    type: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "An error occurred while loading the routine.",
                });
            } finally {
                setIsLoadingRoutine(false);
            }
        },
        [editorRoutineId, hasUnsavedChanges, initializeEditor, routineId, showToast, user?.id]
    );

    useFocusEffect(
        useCallback(() => {
            void fetchRoutine();
        }, [fetchRoutine])
    );

    useFocusEffect(
        useCallback(() => {
            if (!user?.id) return;

            const ownerId = user.id;
            let active = true;
            let requestId = 0;

            const unsubscribe = subscribeToRoutineChanges((changedUserId) => {
                if (changedUserId !== ownerId) return;

                const editorBefore = useRoutineEditorStore.getState();

                if (editorBefore.routineId !== routineId) return;

                // Conservar cualquier edición que todavía no se guardó.
                if (editorBefore.hasUnsavedChanges) return;

                const currentRequest = ++requestId;

                void getLocalRoutine({
                    userId: ownerId,
                    routineId,
                })
                    .then((snapshot) => {
                        if (!active || currentRequest !== requestId) return;

                        const editorNow = useRoutineEditorStore.getState();

                        // También proteger cambios iniciados durante la lectura.
                        if (
                            editorNow !== editorBefore ||
                            editorNow.routineId !== routineId ||
                            editorNow.hasUnsavedChanges
                        ) {
                            return;
                        }

                        if (snapshot) {
                            initializeEditor(snapshot);
                            return;
                        }

                        clearEditor();

                        showToast({
                            type: "warning",
                            message: "This routine is no longer available.",
                        });

                        navigation.goBack();
                    })
                    .catch((error: unknown) => {
                        if (!active || currentRequest !== requestId) return;

                        console.warn("Could not refresh routine detail:", error);
                    });
            });

            return () => {
                active = false;
                requestId += 1;
                unsubscribe();
            };
        }, [user?.id, routineId, initializeEditor, clearEditor, showToast, navigation])
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
            showToast({
                type: "error",
                message: "Please enter a valid positive number",
            });
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
            id: Crypto.randomUUID(),
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

    function buildRoutineSnapshot(): RoutineEditorSnapshot {
        const normalizedName = name.trim();
        if (!normalizedName) throw new Error("Routine name is required.");

        // UUIDs must be stable before persisting the snapshot into the sync queue.
        const isUuid = (value: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        const exerciseIdMap = new Map<string, string>();
        const normalizedExercises = exercises.map((exercise, index) => {
            const id = isUuid(exercise.id) ? exercise.id : Crypto.randomUUID();
            if (exerciseIdMap.has(exercise.id)) {
                throw new Error("Duplicate routine exercise ID.");
            }
            exerciseIdMap.set(exercise.id, id);
            return { ...exercise, id, routine_id: routineId, position: index };
        });

        const normalizedSetsByExerciseId: Record<string, RoutineExerciseSet[]> = {};
        for (const exercise of exercises) {
            const normalizedId = exerciseIdMap.get(exercise.id)!;
            normalizedSetsByExerciseId[normalizedId] = (setsByExerciseId[exercise.id] ?? []).map(
                (setItem) => ({
                    ...setItem,
                    id: isUuid(setItem.id) ? setItem.id : Crypto.randomUUID(),
                    routine_exercise_id: normalizedId,
                    reps: getSetDraftValue(setItem, "reps"),
                    weight: getSetDraftValue(setItem, "weight"),
                })
            );
        }
        return {
            routineId,
            name: normalizedName,
            exercises: normalizedExercises,
            setsByExerciseId: normalizedSetsByExerciseId,
        };
    }

    async function saveRoutineChanges(): Promise<boolean> {
        const normalizedName = name.trim();

        if (!normalizedName) {
            showToast({
                type: "warning",
                message: "Routine name is required.",
            });
            return false;
        }

        if (!hasUnsavedChanges || isSavingRoutine) {
            return true;
        }

        setIsSavingRoutine(true);

        try {
            if (!user?.id) throw new Error("You must be signed in to save a routine.");
            // Do not overwrite a remote-only routine before it has been hydrated locally.
            const local = await getLocalRoutine({ userId: user.id, routineId });
            if (!local)
                throw new Error("Routine is not available locally. Sync it before editing.");

            const snapshot = buildRoutineSnapshot();
            await saveLocalRoutine({
                userId: user.id,
                snapshot,
                syncOperationId: Crypto.randomUUID(),
            });
            initializeEditor(snapshot);
            return true;
        } catch (error: any) {
            showToast({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while saving the routine.",
            });
            return false;
        } finally {
            setIsSavingRoutine(false);
        }
    }

    async function deleteRoutine() {
        if (!user?.id) throw new Error("You must be signed in to delete a routine.");
        await deleteRoutineById({ userId: user.id, routineId });
    }

    async function startWorkout() {
        if (hasUnsavedChanges) {
            showToast({
                type: "warning",
                message: "Save your routine changes before starting the workout.",
            });
            return;
        }

        if (!user) {
            showToast({
                type: "error",
                message: "User not found",
            });
            return;
        }

        if (isStartingWorkoutRef.current) {
            return;
        }

        isStartingWorkoutRef.current = true;
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
            showToast({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while starting the workout.",
            });
        } finally {
            isStartingWorkoutRef.current = false;
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
        if (!user || !activeWorkout || isStartingWorkoutRef.current) {
            return;
        }

        isStartingWorkoutRef.current = true;
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
            showToast({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while discarding the workout.",
            });
        } finally {
            isStartingWorkoutRef.current = false;
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
        clearRoutineEditor: clearEditor,
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
