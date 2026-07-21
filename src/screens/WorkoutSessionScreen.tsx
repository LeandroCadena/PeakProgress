import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DraggableFlatList, {
    RenderItemParams,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActionMenu from "../components/common/ActionMenu";
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
    const [openExerciseMenuId, setOpenExerciseMenuId] =
        useState<string | null>(null);

    const insets = useSafeAreaInsets();

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
        isRoutineMenuOpen,
        setIsRoutineMenuOpen,
    } = useWorkoutSession({
        sessionId,
        routineId,
        routineName,
        onFinish: ({
            updateRoutineAfterWorkout,
        }) =>
            navigation.navigate(
                "WorkoutSummary",
                {
                    sessionId,
                    routineId,
                    routineName,
                    updateRoutineAfterWorkout,
                },
            ),
    });

    return (
        <ScreenContainer contentStyle={styles.screenContent}>
            <View
                style={[
                    styles.headerContainer,
                    {
                        paddingTop: insets.top + spacing.md,
                    },
                ]}
            >
                <View style={styles.leftHeaderContainer}>
                    <ActionMenu
                        open={isRoutineMenuOpen}
                        onOpenChange={setIsRoutineMenuOpen}
                        items={[
                            {
                                key: "workout-settings",
                                label: "Workout settings",
                                icon: "settings-outline",
                                onPress: () => {
                                    setIsRoutineMenuOpen(false);
                                    navigation.navigate("Settings");
                                },
                            },
                        ]}
                        trigger={
                            <Ionicons
                                name="ellipsis-vertical"
                                size={22}
                                color={colors.textSecondary}
                            />
                        }
                    />

                    <Text
                        numberOfLines={1}
                        style={sharedStyles.cardTitle}
                    >
                        {routineName}
                    </Text>

                </View>

                <AppButton
                    title={
                        isFinishingWorkout
                            ? "Finishing..."
                            : "Finish"
                    }
                    variant="primary"
                    disabled={isFinishingWorkout}
                    onPress={finishWorkout}
                    style={styles.rightHeaderContainer}
                    showChevron
                />
            </View>

            <DraggableFlatList
                data={sessionExercises}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                activationDistance={24}
                onDragEnd={({ data }) => {
                    reorderSessionExercises(data);
                }}
                onScrollBeginDrag={() => {
                    setOpenExerciseMenuId(null);
                }}
                onDragBegin={() => {
                    setOpenExerciseMenuId(null);
                }}
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
                                onDrag={drag}
                                isDragging={isActive}
                                isActionsMenuOpen={openExerciseMenuId === item.id}
                                onActionsMenuOpenChange={(open) => {
                                    setOpenExerciseMenuId(open ? item.id : null);
                                }}
                                useGlobalTimers={useGlobalTimers}
                                updateWorkoutSetRest={updateWorkoutSetRest}
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

            {!isInitializingSession ? (
                <View style={styles.footerContainer}>
                    <RestTimerCard
                        timer={timer}
                        lastTimerDuration={lastTimerDuration}
                        onRestart={restartLastTimer}
                    />
                </View>
            ) : null}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        flex: 1,
        paddingBottom: 0,
    },
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,

        zIndex: 20,
        elevation: 20,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,

        backgroundColor: colors.background,

        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    leftHeaderContainer: {
        flexDirection: "row",
        flex: 6,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    rightHeaderContainer: {
        flex: 5,
        paddingVertical: spacing.xs,
    },
    list: {
        gap: spacing.xs,
        paddingTop: 100,
        paddingBottom: 120,
    },
    footerContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,

        backgroundColor: colors.background,

        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,

        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,

        zIndex: 10,
        elevation: 10,
    },
    exerciseItem: {
        marginBottom: spacing.md,
    },
    activeExerciseItem: {
        opacity: 0.96,
        elevation: 6,
    },
});
