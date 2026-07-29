import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { getExercisesByFilter, getMuscleRegions, getMuscles } from "../services/exerciseService";
import { useRoutineEditorStore } from "../store/routineEditorStore";
import { useWorkoutSessionStore } from "../store/workoutSessionStore";
import { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";
import { RoutineExercise, RoutineExerciseSet } from "../types/routine";
import { WorkoutSessionExercise, WorkoutSessionSet } from "../types/workout";

type Params = {
    mode: "routine" | "session";
    routineId?: string;
    sessionId?: string;
    currentCount: number;
    onExerciseAdded: () => void;
};

export function useExercisePicker({
    routineId,
    currentCount,
    onExerciseAdded,
    mode,
    sessionId,
}: Params) {
    const [search, setSearch] = useState("");
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [filterMode, setFilterMode] = useState<FilterMode>("region");
    const [showAdded, setShowAdded] = useState(true);
    const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
    const [regions, setRegions] = useState<MuscleRegion[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const filterOptions = filterMode === "muscle" ? muscles : regions;

    const addRoutineExercise = useRoutineEditorStore((state) => state.addExercise);
    const addSessionExercise = useWorkoutSessionStore((state) => state.addExercise);

    async function fetchMuscles() {
        try {
            const data = await getMuscles();
            setMuscles(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchRegions() {
        try {
            const data = await getMuscleRegions();
            setRegions(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    useEffect(() => {
        fetchMuscles();
        fetchRegions();
    }, []);

    const fetchExercises = useCallback(async () => {
        try {
            const data = await getExercisesByFilter({
                filterMode,
                selectedIds: selectedFilterIds,
            });

            setExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [filterMode, selectedFilterIds]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises, filterMode, selectedFilterIds, showAdded]);

    const filteredExercises = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(search.toLowerCase())
    );

    async function handleAddExercise(exerciseId: string) {
        const exercise = exercises.find((item) => item.id === exerciseId);

        if (!exercise) {
            Alert.alert("Error", "The selected exercise could not be found.");
            return;
        }

        try {
            if (mode === "routine") {
                if (!routineId) {
                    throw new Error("Routine ID is required.");
                }

                const routineExerciseId = `temp-${Crypto.randomUUID()}`;
                const routineSetId = `temp-${Crypto.randomUUID()}`;
                const createdAt = new Date().toISOString();

                const routineExercise: RoutineExercise = {
                    id: routineExerciseId,
                    routine_id: routineId,
                    exercise_id: exercise.id,
                    position: currentCount,
                    rest_seconds: 90,
                    exercise_rest_seconds: 120,
                    exercise: {
                        name: exercise.name,
                        image_url: exercise.image_url ?? null,
                    },
                };

                const firstSet: RoutineExerciseSet = {
                    id: routineSetId,
                    routine_exercise_id: routineExerciseId,
                    reps: 0,
                    weight: 0,
                    is_pr: false,
                    created_at: createdAt,
                };

                addRoutineExercise({
                    exercise: routineExercise,
                    sets: [firstSet],
                });

                onExerciseAdded();
                return;
            }

            if (!sessionId) {
                throw new Error("Workout session ID is required.");
            }

            const workoutSessionExerciseId = Crypto.randomUUID();

            const workoutSetId = Crypto.randomUUID();
            const createdAt = new Date().toISOString();

            const sessionExercise: WorkoutSessionExercise = {
                id: workoutSessionExerciseId,
                workout_session_id: sessionId,
                exercise_id: exercise.id,
                exercise_name_snapshot: exercise.name,
                exercise_image_url_snapshot: exercise.image_url ?? null,
                position: currentCount,
                rest_seconds: 90,
                exercise_rest_seconds: 120,
            };

            const firstSet: WorkoutSessionSet = {
                id: workoutSetId,
                workout_session_exercise_id: workoutSessionExerciseId,
                exercise_id: exercise.id,
                reps: 0,
                weight: 0,
                is_completed: false,
                is_pr: false,
                created_at: createdAt,
            };

            addSessionExercise({
                exercise: sessionExercise,
                sets: [firstSet],
            });

            onExerciseAdded();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unable to add exercise.";

            Alert.alert("Error", message);
        }
    }

    function toggleFilterId(id: string) {
        setSelectedFilterIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }

    function changeFilterMode(mode: FilterMode) {
        setFilterMode(mode);
        setSelectedFilterIds([]);
    }

    function toggleShowAdded() {
        setShowAdded(!showAdded);
        setSelectedFilterIds([]);
    }

    return {
        search,
        setSearch,
        filterMode,
        changeFilterMode,
        showAdded,
        filterOptions,
        selectedFilterIds,
        toggleFilterId,
        toggleShowAdded,
        filteredExercises,
        handleAddExercise,
    };
}
