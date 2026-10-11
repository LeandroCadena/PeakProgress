import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";
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
    currentExerciseIds: string[];
    onExerciseAdded: () => void;
};

export function useExercisePicker({
    routineId,
    currentCount,
    currentExerciseIds,
    onExerciseAdded,
    mode,
    sessionId,
}: Params) {
    const [search, setSearch] = useState("");
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [filterMode, setFilterMode] = useState<FilterMode>("region");
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const addingRef = useRef(false);
    const exerciseCache = useRef(new Map<string, Exercise>());
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

            data.forEach((exercise) => exerciseCache.current.set(exercise.id, exercise));
            setExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [filterMode, selectedFilterIds]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises]);

    const addedIds = new Set(currentExerciseIds);
    const filteredExercises = exercises.filter(
        (exercise) =>
            !addedIds.has(exercise.id) &&
            exercise.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    function toggleExerciseSelection(id: string) {
        if (addingRef.current || addedIds.has(id)) return;
        setSelectedExerciseIds((previous) =>
            previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
        );
    }

    function addExercise(exercise: Exercise, position: number) {
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
                position,
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
            position,
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
    }

    async function handleAddSelectedExercises() {
        if (addingRef.current || selectedExerciseIds.length === 0) return;
        addingRef.current = true;
        setIsAdding(true);
        try {
            if (mode === "routine" && !routineId) throw new Error("Routine ID is required.");
            if (mode === "session" && !sessionId)
                throw new Error("Workout session ID is required.");
            const selected = selectedExerciseIds
                .filter((id) => !addedIds.has(id))
                .map((id) => exerciseCache.current.get(id));
            if (selected.length !== selectedExerciseIds.length || selected.some((item) => !item)) {
                throw new Error("One or more selected exercises could not be found.");
            }
            selected.forEach((exercise, index) => addExercise(exercise!, currentCount + index));
            setSelectedExerciseIds([]);
            onExerciseAdded();
        } catch (error: unknown) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Unable to add exercises."
            );
        } finally {
            addingRef.current = false;
            setIsAdding(false);
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

    return {
        search,
        setSearch,
        filterMode,
        changeFilterMode,
        filterOptions,
        selectedFilterIds,
        toggleFilterId,
        filteredExercises,
        selectedExerciseIds,
        toggleExerciseSelection,
        handleAddSelectedExercises,
        isAdding,
    };
}
