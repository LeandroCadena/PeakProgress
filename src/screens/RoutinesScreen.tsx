import { useFocusEffect } from "@react-navigation/native";
import { useEffect, useState, useCallback } from "react";
import { Text, StyleSheet, TextInput, Pressable, FlatList, Alert } from "react-native";

import ScreenContainer from "../components/common/ScreenContainer";
import ActiveWorkoutBanner from "../components/workout/ActiveWorkoutBanner";
import ActiveWorkoutModal from "../components/workout/ActiveWorkoutModal";
import { useAuth } from "../context/AuthContext";
import { getRoutines, createRoutine as createRoutineService } from "../services/routineService";
import {
    createWorkoutSession,
    getActiveWorkoutSession,
    getOrCreateWorkoutAfterDiscard,
} from "../services/workoutService";
import { Routine } from "../types/routine";

export default function RoutinesScreen({ navigation }: any) {
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState<any>(null);
    const [now, setNow] = useState(Date.now());

    const [routines, setRoutines] = useState<Routine[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [activeWorkoutModalVisible, setActiveWorkoutModalVisible] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [pendingRoutine, setPendingRoutine] = useState<Routine | null>(null);
    const [startingRoutineId, setStartingRoutineId] = useState<string | null>(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchActiveSession = useCallback(async () => {
        if (!user) return;

        try {
            const data = await getActiveWorkoutSession(user.id);
            setActiveSession(data);
        } catch (error) {
            console.log("Active workout error:", error);
        }
    }, [user])

    useFocusEffect(
        useCallback(() => {
            fetchRoutines();
            fetchActiveSession();
        }, [fetchActiveSession])
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
        if (startingRoutineId === routine.id) return;

        setStartingRoutineId(routine.id);

        try {
            const active = await getActiveWorkoutSession(user.id);

            if (active) {
                setActiveWorkout(active);
                setPendingRoutine(routine);
                setActiveWorkoutModalVisible(true);
                return;
            }

            const session = await createWorkoutSession({
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
        } finally {
            setStartingRoutineId(null);
        }
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
        if (!user || !activeWorkout || !pendingRoutine) return;
        if (startingRoutineId) return;

        setStartingRoutineId(pendingRoutine.id);

        try {
            setActiveWorkoutModalVisible(false);

            const session = await getOrCreateWorkoutAfterDiscard({
                userId: user.id,
                routineId: pendingRoutine.id,
                activeSessionId: activeWorkout.id,
            });

            navigation.navigate("WorkoutSession", {
                sessionId: session.id,
                routineId: pendingRoutine.id,
                routineName: pendingRoutine.name,
            });
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setStartingRoutineId(null);
        }
    }

    function getActiveRoutineName(active: any) {
        if (!active) return "Workout";

        return Array.isArray(active.routines) ? active.routines[0]?.name : active.routines?.name;
    }

    function getRestRemainingText(restTimerEndAt?: string | null) {
        if (!restTimerEndAt) return undefined;

        const remainingSeconds = Math.max(
            0,
            Math.ceil((new Date(restTimerEndAt).getTime() - now) / 1000)
        );

        if (remainingSeconds <= 0) return undefined;

        return `${remainingSeconds}s`;
    }

    return (
        <ScreenContainer>
            {activeSession ? (
                <ActiveWorkoutBanner
                    routineName={activeSession.routines?.name ?? "Workout"}
                    elapsedText={getElapsedText(activeSession.started_at)}
                    restRemainingText={getRestRemainingText(activeSession.rest_timer_end_at)}
                    onPress={() =>
                        navigation.navigate("WorkoutSession", {
                            sessionId: activeSession.id,
                            routineId: activeSession.routine_id,
                            routineName: activeSession.routines?.name ?? "Workout",
                        })
                    }
                />
            ) : null}

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
                            style={[
                                styles.startButton,
                                startingRoutineId === item.id && styles.startButtonDisabled,
                            ]}
                            onPress={(event) => {
                                event.stopPropagation();
                                startWorkout(item);
                            }}
                            disabled={startingRoutineId === item.id}
                        >
                            <Text style={styles.startButtonText}>
                                {startingRoutineId === item.id ? "Starting..." : "Start Workout"}
                            </Text>
                        </Pressable>
                    </Pressable>
                )}
            />

            {activeWorkout ? (
                <ActiveWorkoutModal
                    visible={activeWorkoutModalVisible}
                    routineName={getActiveRoutineName(activeWorkout) ?? "Workout"}
                    onResume={resumeActiveWorkout}
                    onDiscardAndStart={discardAndStartWorkout}
                    onCancel={() => setActiveWorkoutModalVisible(false)}
                    isStarting={Boolean(startingRoutineId)}
                />
            ) : null}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
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
    startButtonDisabled: {
        opacity: 0.6,
    },
});
