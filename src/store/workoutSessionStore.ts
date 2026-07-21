import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { WorkoutSessionExercise, WorkoutSessionSet } from "../types/workout";

type UpdateSetInput = {
    workoutSessionExerciseId: string;
    setId: string;
    changes: Partial<WorkoutSessionSet>;
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

    setHasHydrated: (hasHydrated: boolean) => void;

    initializeSession: (params: {
        sessionId: string;
        routineId: string;
        routineName: string;
        sessionExercises: WorkoutSessionExercise[];
        savedSets: Record<string, WorkoutSessionSet[]>;
        restTimerEndAt?: string | null;
        lastTimerDuration?: number;
    }) => void;

    setSessionExercises: (sessionExercises: WorkoutSessionExercise[]) => void;

    setSavedSets: (savedSets: Record<string, WorkoutSessionSet[]>) => void;

    updateEditingValue: (setId: string, field: "weight" | "reps", value: string) => void;

    updateSet: (input: UpdateSetInput) => void;

    addSet: (workoutSessionExerciseId: string, workoutSet: WorkoutSessionSet) => void;

    deleteSet: (workoutSessionExerciseId: string, setId: string) => void;

    deleteExercise: (workoutSessionExerciseId: string) => void;

    setRestTimer: (params: { restTimerEndAt: string | null; lastTimerDuration?: number }) => void;

    clearSession: () => void;
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
};

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
    persist(
        (set) => ({
            ...initialState,

            hasHydrated: false,

            setHasHydrated: (hasHydrated) => {
                set({ hasHydrated });
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
                });
            },

            setSessionExercises: (sessionExercises) => {
                set({ sessionExercises });
            },

            setSavedSets: (savedSets) => {
                set({ savedSets });
            },

            updateEditingValue: (setId, field, value) => {
                const key = `${setId}-${field}`;

                set((state) => ({
                    editingValues: {
                        ...state.editingValues,
                        [key]: value,
                    },
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
                    };
                });
            },

            setRestTimer: ({ restTimerEndAt, lastTimerDuration }) => {
                set((state) => ({
                    restTimerEndAt,
                    lastTimerDuration: lastTimerDuration ?? state.lastTimerDuration,
                }));
            },

            clearSession: () =>
                set({
                    sessionId: null,
                    routineId: null,
                    routineName: null,

                    sessionExercises: [],
                    savedSets: {},
                    editingValues: {},

                    restTimerEndAt: null,
                    lastTimerDuration: 0,
                }),
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
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
