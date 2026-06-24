import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "../context/AuthContext";
import { getExercisesByFilter, getMuscleRegions, getMuscles } from "../services/exerciseService";
import { getUserExerciseBestVolume } from "../services/progressService";
import { addExerciseToRoutine, addExerciseToWorkoutSession } from "../services/workoutService";
import { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

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
    const { user } = useAuth();

    const [search, setSearch] = useState("");
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [filterMode, setFilterMode] = useState<FilterMode>("region");
    const [showAdded, setShowAdded] = useState(true);
    const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
    const [regions, setRegions] = useState<MuscleRegion[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const filterOptions = filterMode === "muscle" ? muscles : regions;

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
        console.log(showAdded);
        fetchExercises();
    }, [fetchExercises, filterMode, selectedFilterIds, showAdded]);

    const filteredExercises = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(search.toLowerCase())
    );

    async function handleAddExercise(exerciseId: string) {
        if (!user?.id) return;

        try {
            const currentPrVolume = await getUserExerciseBestVolume({
                userId: user.id,
                exerciseId,
            });

            if (mode === "routine") {
                await addExerciseToRoutine({
                    routineId: routineId!,
                    exerciseId,
                    restSeconds: 90,
                    position: currentCount,
                    currentPrVolume,
                });
            } else {
                const exercise = exercises.find((item) => item.id === exerciseId);

                await addExerciseToWorkoutSession({
                    userId: user.id,
                    sessionId: sessionId!,
                    exerciseId,
                    exerciseName: exercise?.name ?? "Exercise",
                    exerciseImageUrl: exercise?.image_url ?? null,
                    position: currentCount,
                });
            }

            onExerciseAdded();
        } catch (error: any) {
            Alert.alert("Error", error.message);
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
