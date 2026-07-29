import { create } from "zustand";

import type { RoutineExercise, RoutineExerciseSet } from "../types/routine";

export type RoutineEditorSnapshot = {
    routineId: string;
    name: string;
    exercises: RoutineExercise[];
    setsByExerciseId: Record<string, RoutineExerciseSet[]>;
};

type AddRoutineExerciseInput = {
    exercise: RoutineExercise;
    sets: RoutineExerciseSet[];
};

type UpdateRoutineSetInput = {
    routineExerciseId: string;
    setId: string;
    changes: Partial<Pick<RoutineExerciseSet, "weight" | "reps">>;
};

type RoutineEditorState = {
    routineId: string | null;
    name: string;

    exercises: RoutineExercise[];
    setsByExerciseId: Record<string, RoutineExerciseSet[]>;

    editingValues: Record<string, string>;

    originalSnapshot: RoutineEditorSnapshot | null;
    hasUnsavedChanges: boolean;

    initializeEditor: (snapshot: RoutineEditorSnapshot) => void;

    setName: (name: string) => void;

    reorderExercises: (exercises: RoutineExercise[]) => void;

    addExercise: (input: AddRoutineExerciseInput) => void;

    deleteExercise: (routineExerciseId: string) => void;

    addSet: (routineExerciseId: string, set: RoutineExerciseSet) => void;

    updateSet: (input: UpdateRoutineSetInput) => void;

    deleteSet: (routineExerciseId: string, setId: string) => void;

    updateEditingValue: (setId: string, field: "weight" | "reps", value: string) => void;

    updateSetRest: (routineExerciseId: string, restSeconds: number) => void;

    updateExerciseRest: (routineExerciseId: string, exerciseRestSeconds: number) => void;

    markSaved: () => void;
    discardChanges: () => void;
    clearEditor: () => void;
};

const initialState = {
    routineId: null,
    name: "",

    exercises: [],
    setsByExerciseId: {},
    editingValues: {},

    originalSnapshot: null,
    hasUnsavedChanges: false,
};

function cloneExercises(exercises: RoutineExercise[]): RoutineExercise[] {
    return exercises.map((exercise) => ({
        ...exercise,
        exercise: exercise.exercise ? { ...exercise.exercise } : null,
    }));
}

function cloneSetsByExerciseId(
    setsByExerciseId: Record<string, RoutineExerciseSet[]>
): Record<string, RoutineExerciseSet[]> {
    return Object.fromEntries(
        Object.entries(setsByExerciseId).map(([routineExerciseId, sets]) => [
            routineExerciseId,
            sets.map((set) => ({ ...set })),
        ])
    );
}

function cloneSnapshot(snapshot: RoutineEditorSnapshot): RoutineEditorSnapshot {
    return {
        routineId: snapshot.routineId,
        name: snapshot.name,
        exercises: cloneExercises(snapshot.exercises),
        setsByExerciseId: cloneSetsByExerciseId(snapshot.setsByExerciseId),
    };
}

function createCurrentSnapshot(
    state: Pick<RoutineEditorState, "routineId" | "name" | "exercises" | "setsByExerciseId">
): RoutineEditorSnapshot | null {
    if (!state.routineId) {
        return null;
    }

    return cloneSnapshot({
        routineId: state.routineId,
        name: state.name,
        exercises: state.exercises,
        setsByExerciseId: state.setsByExerciseId,
    });
}

export const useRoutineEditorStore = create<RoutineEditorState>((set) => ({
    ...initialState,

    initializeEditor: (snapshot) => {
        const nextSnapshot = cloneSnapshot(snapshot);

        set({
            routineId: nextSnapshot.routineId,
            name: nextSnapshot.name,
            exercises: nextSnapshot.exercises,
            setsByExerciseId: nextSnapshot.setsByExerciseId,
            editingValues: {},
            originalSnapshot: cloneSnapshot(nextSnapshot),
            hasUnsavedChanges: false,
        });
    },

    setName: (name) => {
        set({
            name,
            hasUnsavedChanges: true,
        });
    },

    reorderExercises: (exercises) => {
        const reorderedExercises = exercises.map((exercise, index) => ({
            ...exercise,
            position: index,
            exercise: exercise.exercise ? { ...exercise.exercise } : null,
        }));

        set({
            exercises: reorderedExercises,
            hasUnsavedChanges: true,
        });
    },

    addExercise: ({ exercise, sets }) => {
        set((state) => {
            const alreadyExists = state.exercises.some(
                (currentExercise) => currentExercise.exercise_id === exercise.exercise_id
            );

            if (alreadyExists) {
                return {};
            }

            return {
                exercises: [
                    ...state.exercises,
                    {
                        ...exercise,
                        exercise: exercise.exercise ? { ...exercise.exercise } : null,
                    },
                ],
                setsByExerciseId: {
                    ...state.setsByExerciseId,
                    [exercise.id]: sets.map((setItem) => ({
                        ...setItem,
                    })),
                },
                hasUnsavedChanges: true,
            };
        });
    },

    deleteExercise: (routineExerciseId) => {
        set((state) => {
            const nextSetsByExerciseId = {
                ...state.setsByExerciseId,
            };

            delete nextSetsByExerciseId[routineExerciseId];

            const deletedSetIds = new Set(
                (state.setsByExerciseId[routineExerciseId] ?? []).map((setItem) => setItem.id)
            );

            const nextEditingValues = Object.fromEntries(
                Object.entries(state.editingValues).filter(([key]) => {
                    const setId = key.split(":")[1];

                    return !deletedSetIds.has(setId);
                })
            );

            return {
                exercises: state.exercises.filter((exercise) => exercise.id !== routineExerciseId),
                setsByExerciseId: nextSetsByExerciseId,
                editingValues: nextEditingValues,
                hasUnsavedChanges: true,
            };
        });
    },

    addSet: (routineExerciseId, setItem) => {
        set((state) => ({
            setsByExerciseId: {
                ...state.setsByExerciseId,
                [routineExerciseId]: [
                    ...(state.setsByExerciseId[routineExerciseId] ?? []),
                    { ...setItem },
                ],
            },
            hasUnsavedChanges: true,
        }));
    },

    updateSet: ({ routineExerciseId, setId, changes }) => {
        set((state) => ({
            setsByExerciseId: {
                ...state.setsByExerciseId,
                [routineExerciseId]: (state.setsByExerciseId[routineExerciseId] ?? []).map(
                    (setItem) =>
                        setItem.id === setId
                            ? {
                                  ...setItem,
                                  ...changes,
                              }
                            : setItem
                ),
            },
            hasUnsavedChanges: true,
        }));
    },

    deleteSet: (routineExerciseId, setId) => {
        set((state) => {
            const nextEditingValues = {
                ...state.editingValues,
            };

            delete nextEditingValues[`weight:${setId}`];
            delete nextEditingValues[`reps:${setId}`];

            return {
                setsByExerciseId: {
                    ...state.setsByExerciseId,
                    [routineExerciseId]: (state.setsByExerciseId[routineExerciseId] ?? []).filter(
                        (setItem) => setItem.id !== setId
                    ),
                },
                editingValues: nextEditingValues,
                hasUnsavedChanges: true,
            };
        });
    },

    updateEditingValue: (setId, field, value) => {
        const key = `${field}:${setId}`;

        set((state) => ({
            editingValues: {
                ...state.editingValues,
                [key]: value,
            },
            hasUnsavedChanges: true,
        }));
    },

    updateSetRest: (routineExerciseId, restSeconds) => {
        set((state) => ({
            exercises: state.exercises.map((exercise) =>
                exercise.id === routineExerciseId
                    ? {
                          ...exercise,
                          rest_seconds: restSeconds,
                      }
                    : exercise
            ),
            hasUnsavedChanges: true,
        }));
    },

    updateExerciseRest: (routineExerciseId, exerciseRestSeconds) => {
        set((state) => ({
            exercises: state.exercises.map((exercise) =>
                exercise.id === routineExerciseId
                    ? {
                          ...exercise,
                          exercise_rest_seconds: exerciseRestSeconds,
                      }
                    : exercise
            ),
            hasUnsavedChanges: true,
        }));
    },

    markSaved: () => {
        set((state) => {
            const savedSnapshot = createCurrentSnapshot(state);

            return {
                originalSnapshot: savedSnapshot,
                editingValues: {},
                hasUnsavedChanges: false,
            };
        });
    },

    discardChanges: () => {
        set((state) => {
            if (!state.originalSnapshot) {
                return initialState;
            }

            const originalSnapshot = cloneSnapshot(state.originalSnapshot);

            return {
                routineId: originalSnapshot.routineId,
                name: originalSnapshot.name,
                exercises: originalSnapshot.exercises,
                setsByExerciseId: originalSnapshot.setsByExerciseId,
                editingValues: {},
                originalSnapshot: cloneSnapshot(originalSnapshot),
                hasUnsavedChanges: false,
            };
        });
    },

    clearEditor: () => {
        set(initialState);
    },
}));
