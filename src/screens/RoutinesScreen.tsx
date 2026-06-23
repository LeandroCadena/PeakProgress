import { useFocusEffect } from "@react-navigation/native";
import { useEffect, useState, useCallback } from "react";
import { Text, StyleSheet, Pressable, FlatList, Alert, View, Image } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import EmptyStateCard from "../components/common/EmptyStateCard";
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
import { colors, spacing, typography } from "../theme";
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
    }, [user]);

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
        <ScreenContainer contentStyle={styles.screenContent}>
            <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <Text style={styles.title}>Routines</Text>

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

                        <AppButton
                            title="+ Create Routine"
                            variant="primary"
                            onPress={createRoutine}
                        />
                    </>
                }
                ListEmptyComponent={
                    <EmptyStateCard
                        title="No routines yet"
                        message="Create your first routine and start building consistency."
                    />
                }
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() =>
                            navigation.navigate("RoutineDetail", {
                                routineId: item.id,
                                routineName: item.name,
                                routineDescription: item.description ?? "",
                            })
                        }
                    >
                        <Card style={styles.routineCard}>
                            <View style={styles.routineContent}>
                                <Image
                                    source={{
                                        uri:
                                            item.imageUrl ??
                                            "https://placehold.co/80x80",
                                    }}
                                    style={styles.routineImage}
                                />

                                <View style={styles.routineInfo}>
                                    <Text style={styles.cardTitle}>
                                        {item.name}
                                    </Text>

                                    <Text style={styles.cardDescription}>
                                        {item.description?.trim() ||
                                            "No description added yet."}
                                    </Text>
                                </View>

                                <View style={styles.actions}>
                                    <AppButton
                                        title={
                                            startingRoutineId === item.id
                                                ? "Starting..."
                                                : "Start"
                                        }
                                        style={{
                                            width: 90,
                                        }}
                                        variant="primary"
                                        disabled={startingRoutineId === item.id}
                                        onPress={() => startWorkout(item)}
                                    />

                                    <Text style={styles.chevron}>
                                        ›
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    </Pressable>
                )}
                ListFooterComponent={
                    activeWorkout ? (
                        <ActiveWorkoutModal
                            visible={activeWorkoutModalVisible}
                            routineName={getActiveRoutineName(activeWorkout) ?? "Workout"}
                            onResume={resumeActiveWorkout}
                            onDiscardAndStart={discardAndStartWorkout}
                            onCancel={() => setActiveWorkoutModalVisible(false)}
                            isStarting={Boolean(startingRoutineId)}
                        />
                    ) : null
                }
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 0,
        paddingTop: 24
    },
    listContent: {
        paddingBottom: 120,
        gap: spacing.md,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightExtraBold,
        marginBottom: spacing.lg,
    },
    createCard: {
        marginBottom: spacing.lg,
    },
    cardTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: typography.weightExtraBold,
    },
    cardDescription: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        lineHeight: 20,
    },
    startButton: {
        marginTop: spacing.sm,
    },
    routineCard: {
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    routineContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    routineImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.background,
    },
    routineInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    chevron: {
        color: colors.textSecondary,
        fontSize: 28,
        fontWeight: typography.weightBold,
    },
});