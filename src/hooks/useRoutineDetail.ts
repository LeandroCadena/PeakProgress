import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { RoutineExercise, RoutineExerciseSet } from "../types/workout";
import {
    getRoutineExercises,
    deleteRoutineExercise as deleteRoutineExerciseService,
    updateRoutineExerciseConfig,
    getOrCreateActiveWorkoutSession,
    updateRoutineExercisePosition,
    getRoutineExerciseSets,
    updateRoutineExerciseSet,
    createRoutineExerciseSet,
    deleteRoutineExerciseSet,
    createRoutineExerciseSets,
    deleteRoutineExerciseSetsByRoutineExerciseId,
    getOrCreateWorkoutAfterDiscard,
    getActiveWorkoutSession,
} from "../services/workoutService";
import {
    updateRoutine,
    deleteRoutineById,
} from "../services/routineService";
import { useFocusEffect } from "@react-navigation/native";
import { updateRoutineExerciseSetCount } from "../services/exerciseService";

type Params = {
    routineId: string;
    routineName: string;
    routineDescription: string;
    navigation: any;
};

export function useRoutineDetail({ routineId, routineName, routineDescription, navigation }: Params) {
    const { user } = useAuth();

    const [routineTitle, setRoutineTitle] = useState(routineName);
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);

    const [templateSetDraftValues, setTemplateSetDraftValues] = useState<
        Record<string, string>
    >({});

    const [editRoutineVisible, setEditRoutineVisible] = useState(false);
    const [editRoutineName, setEditRoutineName] = useState(routineName);
    const [editRoutineDescription, setEditRoutineDescription] = useState(routineDescription);
    const [routineExerciseSets, setRoutineExerciseSets] = useState<
        Record<string, RoutineExerciseSet[]>
    >({});

    const [isEditingRoutine, setIsEditingRoutine] = useState(false);
    const [draftRoutineName, setDraftRoutineName] = useState(routineName);
    const [draftRoutineDescription, setDraftRoutineDescription] = useState(routineDescription);

    const [activeWorkoutModalVisible, setActiveWorkoutModalVisible] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            fetchRoutineExercises();
        }, [routineId])
    );

    async function fetchRoutineExercises() {
        try {
            const data = await getRoutineExercises(routineId);
            setRoutineExercises(data);

            const setGroups = await getRoutineExerciseSets(data.map((item) => item.id));
            setRoutineExerciseSets(setGroups);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteRoutineExercise(routineExerciseId: string) {
        try {
            await deleteRoutineExerciseService(routineExerciseId);
            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function saveRoutineChanges() {
        if (!draftRoutineName.trim()) {
            Alert.alert("Validation", "Routine name is required");
            return;
        }

        const routineInfoChanged =
            draftRoutineName.trim() !== routineTitle ||
            draftRoutineDescription.trim() !== editRoutineDescription.trim();

        const routineSetsChanged =
            Object.keys(templateSetDraftValues).length > 0;

        if (!routineInfoChanged && !routineSetsChanged) {
            setIsEditingRoutine(false);
            return;
        }

        try {
            if (routineSetsChanged) {
                await persistRoutineChanges();
            }

            if (routineInfoChanged) {
                await updateRoutine({
                    routineId,
                    name: draftRoutineName,
                    description: draftRoutineDescription,
                });
                setRoutineTitle(draftRoutineName.trim());
                setEditRoutineDescription(draftRoutineDescription);
            }
            setIsEditingRoutine(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function persistRoutineChanges() {
        for (const routineExercise of routineExercises) {
            const currentSets = routineExerciseSets[routineExercise.id] ?? [];

            await deleteRoutineExerciseSetsByRoutineExerciseId(routineExercise.id);

            if (!currentSets.length) {
                await updateRoutineExerciseSetCount({
                    routineExerciseId: routineExercise.id,
                    sets: 0,
                });

                continue;
            }

            const setsToInsert = currentSets.map((set, index) => {
                const weightDraft = templateSetDraftValues[`weight:${set.id}`];
                const repsDraft = templateSetDraftValues[`reps:${set.id}`];

                return {
                    routine_exercise_id: routineExercise.id,
                    set_number: index + 1,
                    reps:
                        repsDraft !== undefined && repsDraft.trim() !== ""
                            ? Number(repsDraft)
                            : Number(set.reps ?? 0),
                    weight:
                        weightDraft !== undefined && weightDraft.trim() !== ""
                            ? Number(weightDraft)
                            : Number(set.weight ?? 0),
                };
            });

            await createRoutineExerciseSets(setsToInsert);

            const firstSet = setsToInsert[0];

            await updateRoutineExerciseSetCount({
                routineExerciseId: routineExercise.id,
                sets: setsToInsert.length,
            });

            await updateRoutineExerciseConfig({
                routineExerciseId: routineExercise.id,
                sets: setsToInsert.length,
                reps: firstSet?.reps ?? 0,
                weight: firstSet?.weight ?? 0,
                restSeconds: routineExercise.rest_seconds ?? 90,
                exerciseRestSeconds: routineExercise.exercise_rest_seconds ?? 120,
            });
        }
        setTemplateSetDraftValues({});
    }

    async function deleteRoutine() {
        try {
            await deleteRoutineById(routineId);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function startWorkout() {
        if (!user) {
            Alert.alert("Error", "User not found");
            return;
        }

        try {
            const active = await getActiveWorkoutSession(user.id);

            if (active) {
                setActiveWorkout(active);
                setActiveWorkoutModalVisible(true);
                return;
            }

            const session = await getOrCreateActiveWorkoutSession({
                userId: user.id,
                routineId,
            });

            navigation.navigate("WorkoutSession", {
                sessionId: session.id,
                routineId,
                routineName,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function startEditingRoutine() {
        setDraftRoutineName(routineTitle);
        setDraftRoutineDescription(editRoutineDescription);
        setIsEditingRoutine(true);
    }

    function cancelEditingRoutine() {
        setTemplateSetDraftValues({});
        setDraftRoutineName(routineTitle);
        setDraftRoutineDescription(editRoutineDescription);
        setIsEditingRoutine(false);
    }

    async function moveRoutineExercise(index: number, direction: "up" | "down") {
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= routineExercises.length) return;

        const current = routineExercises[index];
        const target = routineExercises[targetIndex];

        const updated = [...routineExercises];

        updated[index] = target;
        updated[targetIndex] = current;

        setRoutineExercises(updated);

        try {
            await Promise.all([
                updateRoutineExercisePosition({
                    routineExerciseId: current.id,
                    position: targetIndex,
                }),
                updateRoutineExercisePosition({
                    routineExerciseId: target.id,
                    position: index,
                }),
            ]);

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
            await fetchRoutineExercises();
        }
    }

    async function updateTemplateSet(
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        const numericValue = value.trim() === "" ? 0 : Number(value);

        if (Number.isNaN(numericValue)) {
            Alert.alert("Validation", "Please enter a valid number");
            return;
        }

        try {
            await updateRoutineExerciseSet({
                setId,
                field,
                value: numericValue,
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function addTemplateSet(routineExerciseId: string) {
        const currentSets = routineExerciseSets[routineExerciseId] ?? [];
        const lastSet = currentSets[currentSets.length - 1];

        const setNumber =
            currentSets.length > 0
                ? Math.max(...currentSets.map((set) => set.set_number)) + 1
                : 1;

        const lastWeight = lastSet
            ? templateSetDraftValues[`${lastSet.id}-weight`] ??
            String(lastSet.weight ?? 0)
            : "0";

        const lastReps = lastSet
            ? templateSetDraftValues[`${lastSet.id}-reps`] ??
            String(lastSet.reps ?? 0)
            : "0";

        try {
            await createRoutineExerciseSet({
                routineExerciseId,
                setNumber,
                reps: Number(lastReps),
                weight: Number(lastWeight),
            });

            await updateRoutineExerciseSetCount({
                routineExerciseId,
                sets: currentSets.length + 1,
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteTemplateSet(routineExerciseId: string, setId: string) {
        const currentSets = routineExerciseSets[routineExerciseId] ?? [];

        try {
            await deleteRoutineExerciseSet(setId);

            await updateRoutineExerciseSetCount({
                routineExerciseId,
                sets: Math.max(0, currentSets.length - 1),
            });

            await fetchRoutineExercises();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function updateLocalTemplateSetValue(
        setId: string,
        field: "weight" | "reps",
        value: string
    ) {
        const key = `${field}:${setId}`;

        setTemplateSetDraftValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function getActiveRoutineName(active: any) {
        return Array.isArray(active.routines)
            ? active.routines[0]?.name
            : active.routines?.name;
    }

    function getElapsedText(startedAt: string) {
        const diffMs = Date.now() - new Date(startedAt).getTime();
        const minutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;

        if (hours > 0) return `${hours}h ${restMinutes}m`;
        return `${minutes}m`;
    }

    function resumeActiveWorkout() {
        if (!activeWorkout) return;

        setActiveWorkoutModalVisible(false);

        navigation.navigate("WorkoutSession", {
            sessionId: activeWorkout.id,
            routineId: activeWorkout.routine_id,
            routineName: getActiveRoutineName(activeWorkout) ?? "Workout",
        });
    }

    async function discardAndStartWorkout() {
        if (!user || !activeWorkout) return;

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
                routineName,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    function updateSetRest(routineExerciseId: string, value: number) {
        setRoutineExercises((prev) =>
            prev.map((exercise) =>
                exercise.id === routineExerciseId
                    ? { ...exercise, rest_seconds: value }
                    : exercise
            )
        );
    }

    function updateExerciseRest(routineExerciseId: string, value: number) {
        setRoutineExercises((prev) =>
            prev.map((exercise) =>
                exercise.id === routineExerciseId
                    ? {
                        ...exercise,
                        exercise_rest_seconds: value,
                    }
                    : exercise
            )
        );
    }

    return {
        routineTitle,
        routineExercises,
        moveRoutineExercise,

        editRoutineVisible,
        setEditRoutineVisible,
        editRoutineName,
        editRoutineDescription,
        setEditRoutineName,
        setEditRoutineDescription,

        deleteRoutineExercise,
        saveRoutineChanges,
        deleteRoutine,
        startWorkout,

        isEditingRoutine,
        draftRoutineName,
        draftRoutineDescription,
        setDraftRoutineName,
        setDraftRoutineDescription,
        startEditingRoutine,
        cancelEditingRoutine,

        routineExerciseSets,
        updateTemplateSet,
        addTemplateSet,
        deleteTemplateSet,

        templateSetDraftValues,
        updateLocalTemplateSetValue,

        activeWorkoutModalVisible,
        activeWorkoutRoutineName: activeWorkout
            ? getActiveRoutineName(activeWorkout) ?? "Workout"
            : "Workout",
        activeWorkoutElapsedText: activeWorkout
            ? getElapsedText(activeWorkout.started_at)
            : undefined,
        setActiveWorkoutModalVisible,
        resumeActiveWorkout,
        discardAndStartWorkout,

        updateSetRest,
        updateExerciseRest,
    };
}