import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActionMenu from "../components/common/ActionMenu";
import AppButton from "../components/common/AppButton";
import EmptyStateCard from "../components/common/EmptyStateCard";
import LoadingCard from "../components/common/LoadingCard";
import ScreenContainer from "../components/common/ScreenContainer";
import RoutineExerciseCard from "../components/routine/RoutineExerciseCard";
import ActiveWorkoutModal from "../components/workout/ActiveWorkoutModal";
import RestTimeEditor from "../components/workout/RestTimeEditor";
import { useRoutineDetail } from "../hooks/useRoutineDetail";
import { colors, sharedStyles, spacing } from "../theme";
import type { RoutineExercise } from "../types/routine";

type RoutineDetailRouteParams = {
    RoutineDetail: {
        routineId: string;
        routineName: string;
    };
};

export default function RoutineDetailScreen() {
    const navigation = useNavigation<any>();

    const route = useRoute<RouteProp<RoutineDetailRouteParams, "RoutineDetail">>();

    const { routineId, routineName } = route.params;

    const insets = useSafeAreaInsets();

    const [isRoutineMenuOpen, setIsRoutineMenuOpen] = useState(false);

    const {
        routineTitle,
        routineExercises,
        routineExerciseSets,

        hasUnsavedChanges,
        isLoadingRoutine,
        isSavingRoutine,
        isStartingWorkout,

        setRoutineName,
        reorderRoutineExercises,
        deleteRoutineExercise,

        updateTemplateSet,
        addTemplateSet,
        deleteTemplateSet,
        updateLocalTemplateSetValue,

        updateSetRest,
        updateExerciseRest,

        saveRoutineChanges,
        discardRoutineChanges,

        deleteRoutine,
        startWorkout,

        activeWorkoutModalVisible,
        activeWorkoutRoutineName,
        activeWorkoutElapsedText,
        resumeActiveWorkout,
        discardAndStartWorkout,
        setActiveWorkoutModalVisible,

        openExerciseMenuId,
        setOpenExerciseMenuId,
    } = useRoutineDetail({
        routineId,
        routineName,
        navigation,
    });

    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", (event: any) => {
            if (!hasUnsavedChanges) {
                return;
            }

            event.preventDefault();

            Alert.alert("Discard changes?", "You have unsaved changes in this routine.", [
                {
                    text: "Keep Editing",
                    style: "cancel",
                },
                {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => {
                        discardRoutineChanges();

                        navigation.dispatch(event.data.action);
                    },
                },
            ]);
        });

        return unsubscribe;
    }, [discardRoutineChanges, hasUnsavedChanges, navigation]);

    async function handlePrimaryAction() {
        setIsRoutineMenuOpen(false);
        setOpenExerciseMenuId(null);

        if (hasUnsavedChanges) {
            await saveRoutineChanges();
            return;
        }

        await startWorkout();
    }

    function handleDeleteRoutine() {
        Alert.alert("Delete routine?", "This action cannot be undone.", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: deleteRoutine,
            },
        ]);
    }

    function handleDeleteExercise(routineExerciseId: string) {
        Alert.alert(
            "Delete exercise?",
            "The exercise and its sets will be removed from this routine.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteRoutineExercise(routineExerciseId);
                    },
                },
            ]
        );
    }

    function navigateToExercisePicker() {
        setIsRoutineMenuOpen(false);
        setOpenExerciseMenuId(null);

        navigation.navigate("ExercisePicker", {
            mode: "routine",
            routineId,
            currentCount:
                routineExercises.length > 0
                    ? Math.max(...routineExercises.map((exercise) => exercise.position ?? 0)) + 1
                    : 0,
            currentExerciseIds: routineExercises.map((exercise) => exercise.exercise_id),
        });
    }

    function closeOpenMenus() {
        setIsRoutineMenuOpen(false);
        setOpenExerciseMenuId(null);
    }

    function renderExercise({ item, drag, isActive, getIndex }: RenderItemParams<RoutineExercise>) {
        const index = getIndex() ?? 0;

        return (
            <View style={[styles.exerciseItem, isActive && styles.activeExerciseItem]}>
                <RoutineExerciseCard
                    item={item}
                    sets={routineExerciseSets[item.id] ?? []}
                    onAddSet={() => addTemplateSet(item.id)}
                    onUpdateSet={updateTemplateSet}
                    onDeleteSet={deleteTemplateSet}
                    updateLocalTemplateSetValue={updateLocalTemplateSetValue}
                    onUpdateSetRest={updateSetRest}
                    onDelete={() => handleDeleteExercise(item.id)}
                    onDrag={drag}
                    isDragging={isActive}
                    isActionsMenuOpen={openExerciseMenuId === item.id}
                    onActionsMenuOpenChange={(open) => {
                        setOpenExerciseMenuId(open ? item.id : null);
                    }}
                />

                {index < routineExercises.length - 1 ? (
                    <RestTimeEditor
                        label="Rest before next exercise"
                        value={item.exercise_rest_seconds ?? 120}
                        editable
                        onChange={(value) => {
                            updateExerciseRest(item.id, value);
                        }}
                    />
                ) : null}
            </View>
        );
    }

    const isPrimaryActionLoading = isSavingRoutine || isStartingWorkout;

    const primaryActionTitle = hasUnsavedChanges
        ? isSavingRoutine
            ? "Saving..."
            : "Save"
        : isStartingWorkout
          ? "Starting..."
          : "Start Workout";

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
                        disabled={isLoadingRoutine || isSavingRoutine}
                        items={[
                            {
                                key: "delete",
                                label: "Delete Routine",
                                icon: "trash-outline",
                                destructive: true,
                                onPress: handleDeleteRoutine,
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

                    <TextInput
                        value={routineTitle}
                        onChangeText={setRoutineName}
                        editable={!isLoadingRoutine && !isSavingRoutine}
                        numberOfLines={1}
                        placeholder="Routine name"
                        placeholderTextColor={colors.textSecondary}
                        selectionColor={colors.primary}
                        style={[sharedStyles.cardTitle, styles.titleInput]}
                    />
                </View>

                <AppButton
                    title={primaryActionTitle}
                    variant="primary"
                    disabled={isLoadingRoutine || isPrimaryActionLoading}
                    onPress={handlePrimaryAction}
                    style={styles.rightHeaderContainer}
                    showChevron={!hasUnsavedChanges}
                />
            </View>

            <DraggableFlatList
                data={routineExercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExercise}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.list}
                activationDistance={24}
                onDragEnd={({ data }) => {
                    reorderRoutineExercises(data);
                }}
                onScrollBeginDrag={closeOpenMenus}
                onDragBegin={closeOpenMenus}
                ListEmptyComponent={
                    isLoadingRoutine ? (
                        <LoadingCard />
                    ) : (
                        <EmptyStateCard
                            title="No exercises added yet"
                            message="Add your first exercise now."
                        />
                    )
                }
                ListFooterComponent={
                    <AppButton
                        title="+ Add Exercise"
                        variant="success"
                        disabled={isLoadingRoutine || isSavingRoutine}
                        onPress={navigateToExercisePicker}
                    />
                }
            />

            <ActiveWorkoutModal
                visible={activeWorkoutModalVisible}
                routineName={activeWorkoutRoutineName}
                elapsedText={activeWorkoutElapsedText}
                onResume={resumeActiveWorkout}
                onDiscardAndStart={discardAndStartWorkout}
                onCancel={() => {
                    setActiveWorkoutModalVisible(false);
                }}
                isStarting={isStartingWorkout}
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
        minWidth: 0,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    rightHeaderContainer: {
        flex: 5,
        paddingVertical: spacing.xs,
    },
    list: {
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingTop: 100,
        paddingBottom: 120,
    },
    exerciseItem: {
        marginBottom: spacing.md,
    },
    activeExerciseItem: {
        opacity: 0.96,
        elevation: 6,
    },
    titleInput: {
        flex: 1,
        minWidth: 0,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
});
