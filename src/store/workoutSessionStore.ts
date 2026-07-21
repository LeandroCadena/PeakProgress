import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LocalWorkoutSet = {
    id: string;
    exerciseId: string;
    reps: number | null;
    weight: number | null;
    completed: boolean;
    position: number;
};

export type LocalWorkoutExercise = {
    id: string;
    exerciseId: string;
    name: string;
    imageUrl?: string | null;
    position: number;
    restSeconds: number;
    sets: LocalWorkoutSet[];
};

export type LocalWorkoutSession = {
    id: string;
    routineId: string | null;
    routineName: string;
    startedAt: string;
    restTimerEndAt: string | null;
    exercises: LocalWorkoutExercise[];
};

type InitializeSessionInput = LocalWorkoutSession;

type UpdateSetInput = {
    exerciseId: string;
    setId: string;
    changes: Partial<Pick<LocalWorkoutSet, "reps" | "weight" | "completed" | "position">>;
};

type WorkoutSessionState = {
    session: LocalWorkoutSession | null;
    hasHydrated: boolean;

    setHasHydrated: (hasHydrated: boolean) => void;

    initializeSession: (session: InitializeSessionInput) => void;
    clearSession: () => void;

    updateSet: (input: UpdateSetInput) => void;
    toggleSetCompleted: (exerciseId: string, setId: string) => void;

    setRestTimerEndAt: (restTimerEndAt: string | null) => void;
};

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
    persist(
        (set) => ({
            session: null,
            hasHydrated: false,

            setHasHydrated: (hasHydrated) => {
                set({ hasHydrated });
            },

            initializeSession: (session) => {
                set({ session });
            },

            clearSession: () => {
                set({ session: null });
            },

            updateSet: ({ exerciseId, setId, changes }) => {
                set((state) => {
                    if (!state.session) {
                        return state;
                    }

                    return {
                        session: {
                            ...state.session,
                            exercises: state.session.exercises.map((exercise) => {
                                if (exercise.id !== exerciseId) {
                                    return exercise;
                                }

                                return {
                                    ...exercise,
                                    sets: exercise.sets.map((workoutSet) =>
                                        workoutSet.id === setId
                                            ? {
                                                  ...workoutSet,
                                                  ...changes,
                                              }
                                            : workoutSet
                                    ),
                                };
                            }),
                        },
                    };
                });
            },

            toggleSetCompleted: (exerciseId, setId) => {
                set((state) => {
                    if (!state.session) {
                        return state;
                    }

                    return {
                        session: {
                            ...state.session,
                            exercises: state.session.exercises.map((exercise) => {
                                if (exercise.id !== exerciseId) {
                                    return exercise;
                                }

                                return {
                                    ...exercise,
                                    sets: exercise.sets.map((workoutSet) =>
                                        workoutSet.id === setId
                                            ? {
                                                  ...workoutSet,
                                                  completed: !workoutSet.completed,
                                              }
                                            : workoutSet
                                    ),
                                };
                            }),
                        },
                    };
                });
            },

            setRestTimerEndAt: (restTimerEndAt) => {
                set((state) => {
                    if (!state.session) {
                        return state;
                    }

                    return {
                        session: {
                            ...state.session,
                            restTimerEndAt,
                        },
                    };
                });
            },
        }),
        {
            name: "peak-progress-workout-session",
            storage: createJSONStorage(() => AsyncStorage),

            partialize: (state) => ({
                session: state.session,
            }),

            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
