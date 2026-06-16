import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Pressable,
    TextInput,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";

type RouteParams = {
    RoutineDetail: {
        routineId: string;
        routineName: string;
    };
};

type Exercise = {
    id: string;
    name: string;
};

type RoutineExercise = {
    id: string;
    sets: number;
    reps: number;
    weight: number | null;
    rest_seconds: number;
    exercises: {
        name: string;
    }[];
};

export default function RoutineDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, "RoutineDetail">>();
    const { routineId, routineName } = route.params;

    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);

    const [sets, setSets] = useState("3");
    const [reps, setReps] = useState("10");
    const [weight, setWeight] = useState("0");
    const [restSeconds, setRestSeconds] = useState("90");

    async function fetchAvailableExercises() {
        const { data, error } = await supabase
            .from("exercises")
            .select("id, name")
            .order("name");

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setAvailableExercises(data ?? []);
    }

    async function fetchRoutineExercises() {
        const { data, error } = await supabase
            .from("routine_exercises")
            .select(`
        id,
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

        setRoutineExercises(data ?? []);
    }

    async function addExerciseToRoutine(exerciseId: string) {
        const { error } = await supabase.from("routine_exercises").insert({
            routine_id: routineId,
            exercise_id: exerciseId,
            sets: Number(sets),
            reps: Number(reps),
            weight: Number(weight),
            rest_seconds: Number(restSeconds),
            position: routineExercises.length,
        });

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        await fetchRoutineExercises();
    }

    useEffect(() => {
        fetchAvailableExercises();
        fetchRoutineExercises();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineName}</Text>

            <Text style={styles.sectionTitle}>Current exercises</Text>

            <FlatList
                data={routineExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No exercises added yet.</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            {item.exercises?.[0]?.name ?? "Exercise"}
                        </Text>
                        <Text style={styles.cardText}>
                            {item.sets} sets · {item.reps} reps · {item.weight ?? 0} kg ·{" "}
                            {item.rest_seconds}s rest
                        </Text>
                    </View>
                )}
            />

            <Text style={styles.sectionTitle}>Default configuration</Text>

            <View style={styles.row}>
                <TextInput
                    style={styles.smallInput}
                    placeholder="Sets"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={sets}
                    onChangeText={setSets}
                />
                <TextInput
                    style={styles.smallInput}
                    placeholder="Reps"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={reps}
                    onChangeText={setReps}
                />
            </View>

            <View style={styles.row}>
                <TextInput
                    style={styles.smallInput}
                    placeholder="Weight"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                />
                <TextInput
                    style={styles.smallInput}
                    placeholder="Rest"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={restSeconds}
                    onChangeText={setRestSeconds}
                />
            </View>

            <Text style={styles.sectionTitle}>Add exercise</Text>

            <FlatList
                data={availableExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.addCard}
                        onPress={() => addExerciseToRoutine(item.id)}
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardText}>Tap to add</Text>
                    </Pressable>
                )}
            />
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
        marginBottom: 20,
    },
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
        marginBottom: 12,
    },
    list: {
        gap: 12,
        paddingBottom: 12,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    addCard: {
        backgroundColor: "#102A1A",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#4CAF50",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    emptyText: {
        color: "#9CA3AF",
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    smallInput: {
        flex: 1,
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
});