import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Pressable,
    Alert,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";

type RouteParams = {
    WorkoutSession: {
        sessionId: string;
        routineId: string;
        routineName: string;
    };
};

type RoutineExercise = {
    id: string;
    exercise_id: string;
    sets: number;
    reps: number;
    weight: number | null;
    rest_seconds: number;
    exercises: {
        name: string;
    }[];
};

export default function WorkoutSessionScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "WorkoutSession">>();
    const { sessionId, routineId, routineName } = route.params;

    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [weightByExercise, setWeightByExercise] = useState<Record<string, string>>({});
    const [repsByExercise, setRepsByExercise] = useState<Record<string, string>>({});

    async function fetchRoutineExercises() {
        const { data, error } = await supabase
            .from("routine_exercises")
            .select(`
        id,
        exercise_id,
        sets,
        reps,
        weight,
        rest_seconds,
        exercises (
        name
        )
    `)
            .eq("routine_id", routineId)
            .order("position");

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        const items = (data ?? []) as RoutineExercise[];

        setRoutineExercises(items);

        const initialWeights: Record<string, string> = {};
        const initialReps: Record<string, string> = {};

        items.forEach((item) => {
            initialWeights[item.exercise_id] = String(item.weight ?? 0);
            initialReps[item.exercise_id] = String(item.reps ?? 10);
        });

        setWeightByExercise(initialWeights);
        setRepsByExercise(initialReps);
    }

    async function saveSet(exerciseId: string) {
        const existingSets = await supabase
            .from("workout_sets")
            .select("id")
            .eq("workout_session_id", sessionId)
            .eq("exercise_id", exerciseId);

        const setNumber = (existingSets.data?.length ?? 0) + 1;

        const { error } = await supabase.from("workout_sets").insert({
            workout_session_id: sessionId,
            exercise_id: exerciseId,
            set_number: setNumber,
            reps: Number(repsByExercise[exerciseId] ?? 0),
            weight: Number(weightByExercise[exerciseId] ?? 0),
        });

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        Alert.alert("Set saved", `Set ${setNumber} saved successfully.`);
    }

    async function finishWorkout() {
        const { data, error } = await supabase
            .from("workout_sessions")
            .update({ completed_at: new Date().toISOString() })
            .eq("id", sessionId)
            .select("id, completed_at")
            .single();

        console.log("Finish workout result:", { data, error });

        if (error) {
            Alert.alert("Error finishing workout", error.message);
            return;
        }

        Alert.alert("Workout completed", "Great job!", [
            {
                text: "OK",
                onPress: () => navigation.goBack(),
            },
        ]);
    }

    useEffect(() => {
        fetchRoutineExercises();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineName}</Text>
            <Text style={styles.subtitle}>Workout Session</Text>

            <FlatList
                data={routineExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const exerciseName = item.exercises?.[0]?.name ?? "Exercise";

                    return (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{exerciseName}</Text>

                            <Text style={styles.cardText}>
                                Target: {item.sets} sets · {item.reps} reps · {item.rest_seconds}s rest
                            </Text>

                            <View style={styles.row}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Weight"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                    value={weightByExercise[item.exercise_id] ?? ""}
                                    onChangeText={(value) =>
                                        setWeightByExercise((prev) => ({
                                            ...prev,
                                            [item.exercise_id]: value,
                                        }))
                                    }
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Reps"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                    value={repsByExercise[item.exercise_id] ?? ""}
                                    onChangeText={(value) =>
                                        setRepsByExercise((prev) => ({
                                            ...prev,
                                            [item.exercise_id]: value,
                                        }))
                                    }
                                />
                            </View>

                            <Pressable
                                style={styles.button}
                                onPress={() => saveSet(item.exercise_id)}
                            >
                                <Text style={styles.buttonText}>Save Set</Text>
                            </Pressable>
                        </View>
                    );
                }}
            />

            <Pressable style={styles.finishButton} onPress={finishWorkout}>
                <Text style={styles.buttonText}>Finish Workout</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 20,
    },
    list: {
        gap: 14,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 14,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 12,
    },
    finishButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});