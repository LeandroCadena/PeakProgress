import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { WorkoutSessionRouteParams } from "../types/workout";
import RestTimerCard from "../components/workout/RestTimerCard";
import WorkoutExerciseCard from "../components/workout/WorkoutExerciseCard";
import { useWorkoutSession } from "../hooks/useWorkoutSession";
import RestTimeEditor from "../components/workout/RestTimeEditor";
import LoadingCard from "../components/common/LoadingCard";
import EmptyStateCard from "../components/common/EmptyStateCard";

export default function WorkoutSessionScreen({ navigation }: any) {
    const route = useRoute<RouteProp<WorkoutSessionRouteParams, "WorkoutSession">>();
    const { sessionId, routineId, routineName } = route.params;

    const {
        sessionExercises,
        savedSets,
        timer,
        lastTimerDuration,
        restartLastTimer,
        useGlobalTimers,
        addEmptySet,
        updateSetValue,
        toggleSetCompleted,
        deleteSet,
        finishWorkout,
        getSetInputValue,
        updateLocalSetValue,
        deleteSessionExercise,
        updateWorkoutSetRest,
        updateWorkoutExerciseRest,
        isInitializingSession,
    } = useWorkoutSession({
        sessionId,
        routineId,
        routineName,
        onFinish: () =>
            navigation.navigate("WorkoutSummary", {
                sessionId,
                routineName,
            }),
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineName}</Text>
            <Text style={styles.subtitle}>Workout Session</Text>

            {!isInitializingSession && (
                <RestTimerCard
                    timer={timer}
                    lastTimerDuration={lastTimerDuration}
                    onRestart={restartLastTimer}
                />
            )}

            <FlatList
                data={sessionExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    isInitializingSession ? (
                        <LoadingCard />
                    ) : (
                        <EmptyStateCard />
                    )
                }
                renderItem={({ item, index }) => (
                    <View>
                        <WorkoutExerciseCard
                            exercise={item}
                            savedSets={savedSets[item.id] ?? []}
                            getSetInputValue={getSetInputValue}
                            updateLocalSetValue={updateLocalSetValue}
                            updateSetValue={updateSetValue}
                            toggleSetCompleted={toggleSetCompleted}
                            deleteSet={deleteSet}
                            addEmptySet={addEmptySet}
                            onDeleteExercise={() => deleteSessionExercise(item.id)}
                            onUpdateSetRest={updateWorkoutSetRest}
                            useGlobalTimers={useGlobalTimers}
                        />

                        {index < sessionExercises.length - 1 ? (
                            <RestTimeEditor
                                label="Rest before next exercise"
                                value={item.exercise_rest_seconds ?? 120}
                                editable={!useGlobalTimers}
                                onChange={(value) => updateWorkoutExerciseRest(item.id, value)}
                            />
                        ) : null}
                    </View>
                )}
            />

            <Pressable
                style={styles.addExerciseButton}
                onPress={() =>
                    navigation.navigate("ExercisePicker", {
                        mode: "session",
                        sessionId,
                        currentCount: sessionExercises.length > 0
                            ? Math.max(...sessionExercises.map((item) => item.position ?? 0)) + 1
                            : 0,
                        currentExerciseIds: sessionExercises.map((item) => item.exercise_id),
                    })
                }
            >
                <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
            </Pressable>

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
    addExerciseButton: {
        backgroundColor: "#102A1A",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        marginBottom: 12,
    },
    addExerciseButtonText: {
        color: "#4CAF50",
        fontWeight: "800",
    },
    loadingCard: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 16,
        padding: 18,
        marginTop: 20,
    },

    loadingTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },

    loadingText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
});