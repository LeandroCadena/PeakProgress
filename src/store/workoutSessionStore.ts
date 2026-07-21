import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { WorkoutSessionExercise, WorkoutSessionSet } from "../types/workout";

type UpdateSetInput = {
    workoutSessionExerciseId: string;
    setId: string;
    changes: Partial<WorkoutSessionSet>;
};

type WorkoutSessionSyncStatus = "idle" | "pending" | "syncing" | "error";

type WorkoutSessionState = {
    sessionId: string | null;
    routineId: string | null;
    routineName: string | null;

    sessionExercises: WorkoutSessionExercise[];
    savedSets: Record<string, WorkoutSessionSet[]>;
    editingValues: Record<string, string>;

    restTimerEndAt: string | null;
    lastTimerDuration: number;

    hasHydrated: boolean;

    syncStatus: WorkoutSessionSyncStatus;
    syncError: string | null;

    setHasHydrated: (hasHydrated: boolean) => void;

    markPendingChanges: () => void;
    setSyncing: () => void;
    setSyncSuccess: () => void;
    setSyncError: (message: string) => void;

    initializeSession: (params: {
        sessionId: string;
        routineId: string;
        routineName: string;
        sessionExercises: WorkoutSessionExercise[];
        savedSets: Record<string, WorkoutSessionSet[]>;
        restTimerEndAt?: string | null;
        lastTimerDuration?: number;
    }) => void;
    clearSession: () => void;

    setSessionExercises: (sessionExercises: WorkoutSessionExercise[]) => void;
    updateSessionExercises: (sessionExercises: WorkoutSessionExercise[]) => void;
    deleteExercise: (workoutSessionExerciseId: string) => void;

    updateEditingValue: (setId: string, field: "weight" | "reps", value: string) => void;

    setSavedSets: (savedSets: Record<string, WorkoutSessionSet[]>) => void;
    updateSet: (input: UpdateSetInput) => void;
    addSet: (workoutSessionExerciseId: string, workoutSet: WorkoutSessionSet) => void;
    replaceSavedSets: (savedSets: Record<string, WorkoutSessionSet[]>) => void;
    deleteSet: (workoutSessionExerciseId: string, setId: string) => void;

    setRestTimer: (params: { restTimerEndAt: string | null; lastTimerDuration?: number }) => void;
};

const initialState = {
    sessionId: null,
    routineId: null,
    routineName: null,

    sessionExercises: [],
    savedSets: {},
    editingValues: {},

    restTimerEndAt: null,
    lastTimerDuration: 0,

    syncStatus: "idle" as WorkoutSessionSyncStatus,
    syncError: null,
};

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
    persist(
        (set) => ({
            ...initialState,

            hasHydrated: false,

            setHasHydrated: (hasHydrated) => {
                set({ hasHydrated });
            },

            markPendingChanges: () => {
                set({
                    syncStatus: "pending",
                    syncError: null,
                });
            },

            setSyncing: () => {
                set({
                    syncStatus: "syncing",
                    syncError: null,
                });
            },

            setSyncSuccess: () => {
                set({
                    syncStatus: "idle",
                    syncError: null,
                });
            },

            setSyncError: (message) => {
                set({
                    syncStatus: "error",
                    syncError: message,
                });
            },

            initializeSession: ({
                sessionId,
                routineId,
                routineName,
                sessionExercises,
                savedSets,
                restTimerEndAt = null,
                lastTimerDuration = 0,
            }) => {
                set({
                    sessionId,
                    routineId,
                    routineName,
                    sessionExercises,
                    savedSets,
                    editingValues: {},
                    restTimerEndAt,
                    lastTimerDuration,
                    syncStatus: "idle",
                    syncError: null,
                });
            },

            setSessionExercises: (sessionExercises) => {
                set({ sessionExercises });
            },

            updateSessionExercises: (sessionExercises) => {
                set({
                    sessionExercises,
                    syncStatus: "pending",
                    syncError: null,
                });
            },

            setSavedSets: (savedSets) => {
                set({ savedSets });
            },

            replaceSavedSets: (savedSets) => {
                set({
                    savedSets,
                    editingValues: {},
                });
            },

            updateEditingValue: (setId, field, value) => {
                const key = `${setId}-${field}`;

                set((state) => ({
                    editingValues: {
                        ...state.editingValues,
                        [key]: value,
                    },
                    syncStatus: "pending",
                    syncError: null,
                }));
            },

            updateSet: ({ workoutSessionExerciseId, setId, changes }) => {
                set((state) => ({
                    savedSets: {
                        ...state.savedSets,
                        [workoutSessionExerciseId]: (
                            state.savedSets[workoutSessionExerciseId] ?? []
                        ).map((workoutSet) =>
                            workoutSet.id === setId ? { ...workoutSet, ...changes } : workoutSet
                        ),
                    },
                    syncStatus: "pending",
                    syncError: null,
                }));
            },

            addSet: (workoutSessionExerciseId, workoutSet) => {
                set((state) => ({
                    savedSets: {
                        ...state.savedSets,
                        [workoutSessionExerciseId]: [
                            ...(state.savedSets[workoutSessionExerciseId] ?? []),
                            workoutSet,
                        ],
                    },
                    syncStatus: "pending",
                    syncError: null,
                }));
            },

            deleteSet: (workoutSessionExerciseId, setId) => {
                set((state) => {
                    const nextEditingValues = {
                        ...state.editingValues,
                    };

                    delete nextEditingValues[`${setId}-weight`];

                    delete nextEditingValues[`${setId}-reps`];

                    return {
                        savedSets: {
                            ...state.savedSets,
                            [workoutSessionExerciseId]: (
                                state.savedSets[workoutSessionExerciseId] ?? []
                            ).filter((workoutSet) => workoutSet.id !== setId),
                        },
                        editingValues: nextEditingValues,
                        syncStatus: "pending",
                        syncError: null,
                    };
                });
            },

            deleteExercise: (workoutSessionExerciseId) => {
                set((state) => {
                    const nextSavedSets = {
                        ...state.savedSets,
                    };

                    delete nextSavedSets[workoutSessionExerciseId];

                    return {
                        sessionExercises: state.sessionExercises.filter(
                            (exercise) => exercise.id !== workoutSessionExerciseId
                        ),
                        savedSets: nextSavedSets,
                        syncStatus: "pending",
                        syncError: null,
                    };
                });
            },

            setRestTimer: ({ restTimerEndAt, lastTimerDuration }) => {
                set((state) => ({
                    restTimerEndAt,
                    lastTimerDuration: lastTimerDuration ?? state.lastTimerDuration,
                }));
            },

            clearSession: () => {
                set(initialState);
            },
        }),
        {
            name: "peak-progress-workout-session",
            storage: createJSONStorage(() => AsyncStorage),

            partialize: (state) => ({
                sessionId: state.sessionId,
                routineId: state.routineId,
                routineName: state.routineName,
                sessionExercises: state.sessionExercises,
                savedSets: state.savedSets,
                editingValues: state.editingValues,
                restTimerEndAt: state.restTimerEndAt,
                lastTimerDuration: state.lastTimerDuration,
                syncStatus: state.syncStatus,
                syncError: state.syncError,
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
