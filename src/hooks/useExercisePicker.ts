import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";
import { getExercisesByFilter, getMuscleRegions, getMuscles } from "../services/exerciseService";
import { addExerciseToRoutine } from "../services/workoutService";

type Params = {
    routineId: string;
    currentCount: number;
    onExerciseAdded: () => void;
};

export function useExercisePicker({
    routineId,
    currentCount,
    onExerciseAdded,
}: Params) {
    const [search, setSearch] = useState("");
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [filterMode, setFilterMode] = useState<FilterMode>("region");
    const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
    const [regions, setRegions] = useState<MuscleRegion[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const filterOptions = filterMode === "muscle" ? muscles : regions;

    useEffect(() => {
        fetchMuscles();
        fetchRegions();
    }, []);

    useEffect(() => {
        fetchExercises();
    }, [filterMode, selectedFilterIds]);

    const filteredExercises = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(search.toLowerCase())
    );

    async function fetchMuscles() {
        try {
            const data = await getMuscles();
            setMuscles(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchExercises() {
        try {
            const data = await getExercisesByFilter({
                filterMode,
                selectedIds: selectedFilterIds,
            });

            setExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function handleAddExercise(exerciseId: string) {
        try {
            await addExerciseToRoutine({
                routineId,
                exerciseId,
                sets: 3,
                reps: 10,
                weight: 0,
                restSeconds: 90,
                position: currentCount,
            });

            onExerciseAdded();
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

    function toggleFilterId(id: string) {
        setSelectedFilterIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
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
        handleAddExercise,
    };
}