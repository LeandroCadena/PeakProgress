import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActionMenu from "../components/common/ActionMenu";
import AppButton from "../components/common/AppButton";
import AppDialog from "../components/common/AppDialog";
import EmptyStateCard from "../components/common/EmptyStateCard";
import LoadingCard from "../components/common/LoadingCard";
import ScreenContainer from "../components/common/ScreenContainer";
import RestTimeEditor from "../components/workout/RestTimeEditor";
import RestTimerCard from "../components/workout/RestTimerCard";
import WorkoutExerciseCard from "../components/workout/WorkoutExerciseCard";
import { useWorkoutSession } from "../hooks/useWorkoutSession";
import { colors, sharedStyles, spacing } from "../theme";
import { WorkoutSessionExercise, WorkoutSessionRouteParams } from "../types/workout";

type WorkoutDialogState =
    | { type: "deleteExercise"; exerciseId: string }
    | { type: "finishWorkout" }
    | null;

export default function WorkoutSessionScreen({ navigation }: any) {
    const route = useRoute<RouteProp<WorkoutSessionRouteParams, "WorkoutSession">>();
    const { sessionId, routineId, routineName } = route.params;
    const [openExerciseMenuId, setOpenExerciseMenuId] = useState<string | null>(null);

    const [dialog, setDialog] = useState<WorkoutDialogState>(null);
    const [dialogError, setDialogError] = useState<string | null>(null);

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
        currentExerciseRecordLabel,
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
        onFinish: ({ updateRoutineAfterWorkout }) =>
            navigation.navigate("WorkoutSummary", {
                sessionId,
                routineId,
                routineName,
                updateRoutineAfterWorkout,
            }),
    });

    function handleDeleteExercise(exerciseId: string) {
        setOpenExerciseMenuId(null);
        setDialog({ type: "deleteExercise", exerciseId });
    }

    function handleFinishWorkout() {
        if (isFinishingWorkout || isInitializingSession) return;

        setDialogError(null);
        setDialog({ type: "finishWorkout" });
    }

    async function confirmDialog() {
        if (!dialog) return;

        if (dialog.type === "deleteExercise") {
            await deleteSessionExercise(dialog.exerciseId);
            setDialog(null);
            return;
        }

        if (dialog.type === "finishWorkout") {
            setDialogError(null);

            try {
                await finishWorkout();
                setDialog(null);
            } catch (error: unknown) {
                setDialogError(
                    error instanceof Error
                        ? error.message
                        : "Unable to finish workout. Please try again."
                );
            }
        }
    }

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
                                key: "Settings",
                                label: "Settings",
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

                    <Text numberOfLines={1} style={sharedStyles.cardTitle}>
                        {routineName}
                    </Text>
                </View>

                <AppButton
                    title={isFinishingWorkout ? "Finishing..." : "Finish"}
                    variant="primary"
                    disabled={isFinishingWorkout || isInitializingSession}
                    onPress={handleFinishWorkout}
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
                                onDeleteExercise={() => handleDeleteExercise(item.id)}
                                onDrag={drag}
                                isDragging={isActive}
                                isActionsMenuOpen={openExerciseMenuId === item.id}
                                onActionsMenuOpenChange={(open) => {
                                    setOpenExerciseMenuId(open ? item.id : null);
                                }}
                                useGlobalTimers={useGlobalTimers}
                                updateWorkoutSetRest={updateWorkoutSetRest}
                                currentExerciseRecord={currentExerciseRecordLabel(item.exercise_id)}
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
                                            ...sessionExercises.map((item) => item.position ?? 0)
                                        ) + 1
                                        : 0,
                                currentExerciseIds: sessionExercises.map(
                                    (item) => item.exercise_id
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

            <AppDialog
                visible={dialog !== null}
                title={
                    dialog?.type === "finishWorkout"
                        ? "Finish workout?"
                        : "Delete exercise?"
                }
                message={
                    dialog?.type === "finishWorkout"
                        ? "Are you sure you want to finish this workout?"
                        : "The exercise and its sets will be removed from this workout."
                }
                errorMessage={dialogError}
                confirmLabel={dialog?.type === "finishWorkout" ? "Finish" : "Delete"}
                cancelLabel="Cancel"
                variant={dialog?.type === "finishWorkout" ? "primary" : "danger"}
                onConfirm={confirmDialog}
                onCancel={() => {
                    setDialog(null);
                    setDialogError(null);
                }}
            />
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
