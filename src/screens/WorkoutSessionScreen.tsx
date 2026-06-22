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
import { colors, spacing, typography } from "../theme";
import AppButton from "../components/common/AppButton";

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
        isFinishingWorkout,
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

            <AppButton
                title="+ Add Exercise"
                variant="success"
                onPress={() =>
                    navigation.navigate("ExercisePicker", {
                        mode: "session",
                        sessionId,
                        currentCount:
                            sessionExercises.length > 0
                                ? Math.max(...sessionExercises.map((item) => item.position ?? 0)) + 1
                                : 0,
                        currentExerciseIds: sessionExercises.map((item) => item.exercise_id),
                    })
                }
                style={styles.actionButton}
            />

            <AppButton
                title={isFinishingWorkout ? "Finishing..." : "Finish Workout"}
                variant="primary"
                disabled={isFinishingWorkout}
                onPress={finishWorkout}
                style={styles.actionButton}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        marginBottom: spacing.md,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xxl,
        paddingTop: 64,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
    },
    subtitle: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    list: {
        gap: spacing.lg,
        paddingBottom: spacing.xxl,
    },
});