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

type AddSessionExerciseInput = {
    exercise: WorkoutSessionExercise;
    sets: WorkoutSessionSet[];
};

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

    replaceSessionExercises: (sessionExercises: WorkoutSessionExercise[]) => void;
    addExercise: (input: AddSessionExerciseInput) => void;
    deleteExercise: (workoutSessionExerciseId: string) => void;

    updateEditingValue: (setId: string, field: "weight" | "reps", value: string) => void;
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

const pendingSyncState = {
    syncStatus: "pending" as WorkoutSessionSyncStatus,
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

            replaceSessionExercises: (sessionExercises) => {
                set({
                    sessionExercises,
                    ...pendingSyncState,
                });
            },

            replaceSavedSets: (savedSets) => {
                set({
                    savedSets,
                    editingValues: {},
                    ...pendingSyncState,
                });
            },

            updateEditingValue: (setId, field, value) => {
                const key = `${setId}-${field}`;

                set((state) => ({
                    editingValues: {
                        ...state.editingValues,
                        [key]: value,
                    },
                    ...pendingSyncState,
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
                    ...pendingSyncState,
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
                    ...pendingSyncState,
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
                        ...pendingSyncState,
                    };
                });
            },

            addExercise: ({ exercise, sets }) => {
                set((state) => {
                    const alreadyExists = state.sessionExercises.some(
                        (sessionExercise) => sessionExercise.exercise_id === exercise.exercise_id
                    );

                    if (alreadyExists) {
                        return state;
                    }

                    return {
                        sessionExercises: [...state.sessionExercises, exercise],
                        savedSets: {
                            ...state.savedSets,
                            [exercise.id]: sets,
                        },
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
                        ...pendingSyncState,
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
