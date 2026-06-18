import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import {
    getRoutines,
    createRoutine as createRoutineService,
} from "../services/routineService";
import { Routine } from "../types/routine";
import { getOrCreateActiveWorkoutSession } from "../services/workoutService";

export default function RoutinesScreen({ navigation }: any) {
    const { user } = useAuth();

    const [routines, setRoutines] = useState<Routine[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useFocusEffect(
        useCallback(() => {
            fetchRoutines();
        }, [])
    );

    async function fetchRoutines() {
        try {
            const data = await getRoutines();
            setRoutines(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function createRoutine() {
        if (!user?.id) {
            Alert.alert("Auth error", "User is not logged in");
            return;
        }

        if (!name.trim()) {
            Alert.alert("Validation", "Routine name is required");
            return;
        }

        try {
            await createRoutineService({
                userId: user.id,
                name,
                description,
            });

            setName("");
            setDescription("");
            await fetchRoutines();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function startWorkout(routine: Routine) {
        if (!user) {
            Alert.alert("Error", "User not found");
            return;
        }

        try {
            const session = await getOrCreateActiveWorkoutSession({
                userId: user.id,
                routineId: routine.id,
            });

            navigation.navigate("WorkoutSession", {
                sessionId: session.id,
                routineId: routine.id,
                routineName: routine.name,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Routines</Text>

            <TextInput
                style={styles.input}
                placeholder="Routine name"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
            />

            <Pressable style={styles.button} onPress={createRoutine}>
                <Text style={styles.buttonText}>Create Routine</Text>
            </Pressable>

            <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("RoutineDetail", {
                                routineId: item.id,
                                routineName: item.name,
                                routineDescription: item.description ?? "",
                            })
                        }
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>

                        {item.description ? (
                            <Text style={styles.cardDescription}>{item.description}</Text>
                        ) : null}
                        <Pressable
                            style={styles.startButton}
                            onPress={() => startWorkout(item)}
                        >
                            <Text style={styles.startButtonText}>Start Workout</Text>
                        </Pressable>
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
        marginBottom: 24,
    },
    input: {
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 24,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
        textAlign: "center",
    },
    list: {
        gap: 12,
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
    cardDescription: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    startButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
    },

    startButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
});