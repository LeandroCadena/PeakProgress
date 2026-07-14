import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { View, Text, StyleSheet } from "react-native";
import DraggableFlatList, {
    RenderItemParams,
} from "react-native-draggable-flatlist";

import AppButton from "../components/common/AppButton";
import EmptyStateCard from "../components/common/EmptyStateCard";
import LoadingCard from "../components/common/LoadingCard";
import ScreenContainer from "../components/common/ScreenContainer";
import RestTimeEditor from "../components/workout/RestTimeEditor";
import RestTimerCard from "../components/workout/RestTimerCard";
import WorkoutExerciseCard from "../components/workout/WorkoutExerciseCard";
import { useWorkoutSession } from "../hooks/useWorkoutSession";
import { colors, sharedStyles, spacing } from "../theme";
import {
    WorkoutSessionExercise,
    WorkoutSessionRouteParams,
} from "../types/workout";

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
        reorderSessionExercises,
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
        <ScreenContainer contentStyle={styles.screenContent}>
            <DraggableFlatList
                data={sessionExercises}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                activationDistance={24}
                onDragEnd={({ data }) => {
                    reorderSessionExercises(data);
                }}
                ListHeaderComponent={
                    <>
                        <Text style={sharedStyles.screenTitle}>{routineName}</Text>
                        <Text style={sharedStyles.screenSubtitle}>Workout Session</Text>

                        {!isInitializingSession ? (
                            <RestTimerCard
                                timer={timer}
                                lastTimerDuration={lastTimerDuration}
                                onRestart={restartLastTimer}
                            />
                        ) : null}
                    </>
                }
                ListEmptyComponent={
                    isInitializingSession ? (
                        <LoadingCard />
                    ) : (
                        <EmptyStateCard
                            title="No exercises yet"
                            message="Add your first exercise to this workout."
                        />
                    )
                }
                renderItem={({
                    item,
                    drag,
                    isActive,
                    getIndex,
                }: RenderItemParams<WorkoutSessionExercise>) => {
                    const index = getIndex() ?? 0;

                    return (
                        <View style={[styles.exerciseItem, isActive && styles.activeExerciseItem]}>
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
                                onDrag={drag}
                                isDragging={isActive}
                            />

                            {index < sessionExercises.length - 1 ? (
                                <RestTimeEditor
                                    label="Rest before next exercise"
                                    value={item.exercise_rest_seconds ?? 120}
                                    editable={!useGlobalTimers}
                                    onChange={(value) =>
                                        updateWorkoutExerciseRest(item.id, value)
                                    }
                                />
                            ) : null}
                        </View>
                    );
                }}
                ListFooterComponent={
                    <AppButton
                        title="+ Add Exercise"
                        variant="success"
                        onPress={() =>
                            navigation.navigate("ExercisePicker", {
                                mode: "session",
                                sessionId,
                                currentCount:
                                    sessionExercises.length > 0
                                        ? Math.max(
                                            ...sessionExercises.map(
                                                (item) => item.position ?? 0,
                                            ),
                                        ) + 1
                                        : 0,
                                currentExerciseIds: sessionExercises.map(
                                    (item) => item.exercise_id,
                                ),
                            })
                        }
                    />
                }
            />

            <View style={styles.footerContainer}>
                <View style={styles.footer}>
                    <AppButton
                        title={isFinishingWorkout ? "Finishing..." : "Finish Workout"}
                        variant="primary"
                        disabled={isFinishingWorkout}
                        onPress={finishWorkout}
                        iconLeft={<Ionicons name="barbell-outline" size={22} color={colors.text} />}
                        showChevron
                    />
                </View>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        flex: 1,
        paddingBottom: 0,
    },
    exerciseListContainer: {
        flex: 1,
        minHeight: 0,
    },
    list: {
        gap: spacing.md,
        paddingBottom: 120,
    },
    footerContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,

        backgroundColor: colors.background,

        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,

        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,

        zIndex: 10,
        elevation: 10,
    },
    footer: {
        width: "100%",
    },
    exerciseItem: {
        marginBottom: spacing.md,
    },
    activeExerciseItem: {
        opacity: 0.96,
        elevation: 6,
    },
});
