import { Ionicons } from "@expo/vector-icons";
import {
    NavigationAction,
    RouteProp,
    StackActions,
    useNavigation,
    useRoute,
} from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActionMenu from "../components/common/ActionMenu";
import AppButton from "../components/common/AppButton";
import AppDialog from "../components/common/AppDialog";
import EmptyStateCard from "../components/common/EmptyStateCard";
import LoadingCard from "../components/common/LoadingCard";
import ScreenContainer from "../components/common/ScreenContainer";
import RoutineExerciseCard from "../components/routine/RoutineExerciseCard";
import ActiveWorkoutModal from "../components/workout/ActiveWorkoutModal";
import RestTimeEditor from "../components/workout/RestTimeEditor";
import { useRoutineDetail } from "../hooks/useRoutineDetail";
import { useLanguage } from "../i18n/LanguageProvider";
import { spacing, useAppTheme, createThemedStyles } from "../theme";
import type { RoutineExercise } from "../types/routine";

type RoutineDetailRouteParams = {
    RoutineDetail: {
        routineId: string;
        routineName: string;
    };
};

type DialogState =
    | { type: "deleteExercise"; exerciseId: string }
    | { type: "deleteRoutine" }
    | { type: "discardChanges" }
    | { type: "routineVersionConflict"; reason: "changed" | "deleted" | "syncConflict" }
    | null;

export default function RoutineDetailScreen() {
    const { t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RoutineDetailRouteParams, "RoutineDetail">>();
    const { routineId, routineName } = route.params;
    const insets = useSafeAreaInsets();
    const [isRoutineMenuOpen, setIsRoutineMenuOpen] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(null);
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [pendingNavigationAction, setPendingNavigationAction] = useState<NavigationAction | null>(
        null
    );
    const isConfirmedNavigationRef = useRef(false);

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
        reloadRoutine,
        saveDraftAsCopy,

        deleteRoutine,
        clearRoutineEditor,
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
            if (!hasUnsavedChanges || isConfirmedNavigationRef.current) {
                return;
            }

            event.preventDefault();

            setPendingNavigationAction(event.data.action);
            setDialog({ type: "discardChanges" });
        });

        return unsubscribe;
    }, [hasUnsavedChanges, navigation]);

    function dispatchConfirmedNavigation(action: NavigationAction) {
        isConfirmedNavigationRef.current = true;

        try {
            navigation.dispatch(action);
        } finally {
            isConfirmedNavigationRef.current = false;
        }
    }

    async function handlePrimaryAction() {
        setIsRoutineMenuOpen(false);
        setOpenExerciseMenuId(null);

        if (hasUnsavedChanges) {
            const reason = await saveRoutineChanges();
            if (reason) {
                setDialogError(null);
                setDialog({ type: "routineVersionConflict", reason });
            }
            return;
        }

        await startWorkout();
    }

    function handleDeleteExercise(exerciseId: string) {
        setOpenExerciseMenuId(null);
        setDialog({ type: "deleteExercise", exerciseId });
    }

    function handleDeleteRoutine() {
        setIsRoutineMenuOpen(false);
        setDialogError(null);
        setDialog({ type: "deleteRoutine" });
    }

    async function recoverDraft() {
        setDialogError(null);
        try {
            const copy = await saveDraftAsCopy();
            clearRoutineEditor();
            setDialog(null);
            dispatchConfirmedNavigation(StackActions.replace("RoutineDetail", copy));
        } catch (error: unknown) {
            setDialogError(error instanceof Error ? error.message : t("copyError"));
        }
    }

    async function confirmDialog() {
        if (!dialog) return;

        if (dialog.type === "routineVersionConflict") {
            if (dialog.reason !== "changed") {
                await recoverDraft();
                return;
            }

            setDialogError(null);
            try {
                await reloadRoutine();
                setDialog(null);
            } catch (error: unknown) {
                setDialogError(error instanceof Error ? error.message : t("reloadError"));
            }
            return;
        }

        if (dialog.type === "deleteExercise") {
            deleteRoutineExercise(dialog.exerciseId);
            setDialog(null);
            return;
        }

        if (dialog.type === "deleteRoutine") {
            setDialogError(null);

            try {
                await deleteRoutine();

                clearRoutineEditor();

                setDialog(null);

                dispatchConfirmedNavigation({
                    type: "GO_BACK",
                });
            } catch (error: unknown) {
                setDialogError(error instanceof Error ? error.message : t("deleteRoutineError"));
            }

            return;
        }

        if (dialog.type === "discardChanges") {
            if (!pendingNavigationAction) return;

            discardRoutineChanges();

            setDialog(null);
            setPendingNavigationAction(null);

            dispatchConfirmedNavigation(pendingNavigationAction);
        }
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
                        label={t("restBeforeExercise")}
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
            ? t("saving")
            : t("save")
        : isStartingWorkout
          ? t("starting")
          : t("startWorkout");

    const conflictReason = dialog?.type === "routineVersionConflict" ? dialog.reason : undefined;
    const canLoadLatest = conflictReason === "changed";

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
                                label: t("deleteRoutine"),
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
                        placeholder={t("routineName")}
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
                            title={t("noExercisesAdded")}
                            message={t("addFirstExercise")}
                        />
                    )
                }
                ListFooterComponent={
                    <AppButton
                        title={t("addExercise")}
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

            <AppDialog
                visible={dialog !== null && dialog.type !== "routineVersionConflict"}
                title={
                    dialog?.type === "deleteExercise"
                        ? t("deleteExerciseQuestion")
                        : dialog?.type === "deleteRoutine"
                          ? t("deleteRoutineQuestion")
                          : t("discardChangesQuestion")
                }
                message={
                    dialog?.type === "deleteExercise"
                        ? t("removeExerciseDescription")
                        : dialog?.type === "deleteRoutine"
                          ? t("actionCannotBeUndone")
                          : t("unsavedRoutineChanges")
                }
                errorMessage={dialogError}
                confirmLabel={dialog?.type === "discardChanges" ? t("discard") : t("delete")}
                cancelLabel={dialog?.type === "discardChanges" ? t("keepEditing") : t("cancel")}
                variant="danger"
                onConfirm={confirmDialog}
                onCancel={() => {
                    setDialogError(null);
                    setDialog(null);
                    setPendingNavigationAction(null);
                }}
            />

            <AppDialog
                visible={conflictReason !== undefined}
                title={conflictReason === "deleted" ? t("routineDeleted") : t("routineChanged")}
                message={
                    canLoadLatest
                        ? t("routineChangedDescription")
                        : conflictReason === "deleted"
                          ? t("routineDeletedDescription")
                          : t("routineSyncConflictDescription")
                }
                errorMessage={dialogError}
                confirmLabel={canLoadLatest ? t("loadLatest") : t("saveAsCopy")}
                variant={canLoadLatest ? "danger" : "primary"}
                secondaryAction={
                    canLoadLatest ? { label: t("saveAsCopy"), onPress: recoverDraft } : undefined
                }
                cancelLabel={t("keepDraft")}
                onConfirm={confirmDialog}
                onCancel={() => {
                    setDialogError(null);
                    setDialog(null);
                }}
            />
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
}));
