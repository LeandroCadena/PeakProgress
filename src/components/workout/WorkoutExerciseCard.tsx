import { useLanguage } from "../../i18n/LanguageProvider";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { spacing, typography, useAppTheme, createThemedStyles } from "../../theme";
import { WorkoutSessionExercise, WorkoutSessionSet } from "../../types/workout";
import ActionMenu from "../common/ActionMenu";
import AppButton from "../common/AppButton";
import Card from "../common/Card";
import ExerciseCardHeader from "../exercise/ExerciseCardHeader";

import RestTimeEditor from "./RestTimeEditor";
import WorkoutSetRow from "./WorkoutSetRow";

type WorkoutExerciseCardProps = {
    exercise: WorkoutSessionExercise;
    savedSets: WorkoutSessionSet[];
    getSetInputValue: (setId: string, field: "weight" | "reps", value: number | null) => string;
    updateLocalSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
    updateSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
    toggleSetCompleted: (
        workoutSessionExerciseId: string,
        exerciseId: string,
        set: WorkoutSessionSet
    ) => void;
    deleteSet: (setId: string) => void;
    addEmptySet: (exerciseId: string) => void;
    onDeleteExercise: () => void;
    onDrag: () => void;
    isDragging: boolean;
    isActionsMenuOpen: boolean;
    onActionsMenuOpenChange: (open: boolean) => void;
    useGlobalTimers?: boolean;
    updateWorkoutSetRest: (workoutSessionExerciseId: string, value: number) => void;
    currentExerciseRecord: string | null;
    effectiveSetRestSeconds: number;
};

export default function WorkoutExerciseCard({
    exercise,
    savedSets,
    getSetInputValue,
    updateLocalSetValue,
    updateSetValue,
    toggleSetCompleted,
    deleteSet,
    addEmptySet,
    onDeleteExercise,
    onDrag,
    isDragging,
    isActionsMenuOpen,
    onActionsMenuOpenChange,
    useGlobalTimers = false,
    updateWorkoutSetRest,
    currentExerciseRecord,
    effectiveSetRestSeconds,
}: WorkoutExerciseCardProps) {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const exerciseName = exercise.exercise_name_snapshot ?? t("exercise");

    return (
        <Card style={[styles.card, isDragging && styles.cardDragging]}>
            <Pressable
                onPress={() => {
                    if (!isDragging) {
                        setIsCollapsed((prev) => !prev);
                    }
                }}
                onLongPress={onDrag}
                delayLongPress={250}
            >
                <ExerciseCardHeader
                    imageUrl={exercise.exercise_image_url_snapshot}
                    title={exerciseName}
                    exerciseRecord={currentExerciseRecord}
                    rightContent={
                        <View style={styles.headerActions}>
                            <ActionMenu
                                open={isActionsMenuOpen}
                                onOpenChange={onActionsMenuOpenChange}
                                disabled={isDragging}
                                items={[
                                    {
                                        key: "delete",
                                        label: t("deleteExercise"),
                                        icon: "trash-outline",
                                        destructive: true,
                                        onPress: onDeleteExercise,
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

                            <Ionicons
                                name={isCollapsed ? "chevron-down" : "chevron-up"}
                                size={22}
                                color={colors.text}
                            />
                        </View>
                    }
                />
            </Pressable>
            {!isCollapsed ? (
                <>
                    <RestTimeEditor
                        label={t("restBetweenSets")}
                        value={effectiveSetRestSeconds}
                        editable={!useGlobalTimers}
                        onChange={(value) => updateWorkoutSetRest(exercise.id, value)}
                    />

                    <View style={styles.divider} />

                    <View style={styles.setTableHeader}>
                        <Text style={styles.setNumberHeader}>{t("set")}</Text>
                        <Text style={styles.setHeaderText}>{t("weight")}</Text>
                        <Text style={styles.setHeaderText}>{t("reps")}</Text>
                        <Text style={styles.doneHeader}>{t("done")}</Text>
                    </View>

                    {savedSets.map((set, index) => {
                        const isTemporarySet = set.id.startsWith("temp-");

                        return (
                            <WorkoutSetRow
                                key={set.id}
                                set={set}
                                isPersonalRecord={Boolean(set.is_completed && set.is_pr)}
                                displaySetNumber={index + 1}
                                weightValue={getSetInputValue(set.id, "weight", set.weight)}
                                repsValue={getSetInputValue(set.id, "reps", set.reps)}
                                onWeightChange={(value) =>
                                    updateLocalSetValue(set.id, "weight", value)
                                }
                                onRepsChange={(value) => updateLocalSetValue(set.id, "reps", value)}
                                onWeightBlur={(value) => updateSetValue(set.id, "weight", value)}
                                onRepsBlur={(value) => updateSetValue(set.id, "reps", value)}
                                onToggleCompleted={() =>
                                    toggleSetCompleted(exercise.id, exercise.exercise_id, set)
                                }
                                onDelete={() => deleteSet(set.id)}
                                isTemporarySet={isTemporarySet}
                            />
                        );
                    })}

                    <AppButton
                        title={t("addSet")}
                        variant="success"
                        onPress={() => addEmptySet(exercise.id)}
                        style={styles.addSetButton}
                    />
                </>
            ) : null}
        </Card>
    );
}

const getStyles = createThemedStyles((colors) => ({
    card: {
        gap: spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: colors.cardBorder,
    },
    setTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    setNumberHeader: {
        width: 22,
        color: colors.textSecondary,
        fontSize: typography.small,
        fontWeight: typography.weightBold,
        marginLeft: spacing.xs,
    },
    setHeaderText: {
        flex: 1,
        color: colors.textSecondary,
        fontWeight: typography.weightBold,
        fontSize: typography.small,
        marginLeft: spacing.sm,
    },
    doneHeader: {
        width: 36,
        color: colors.textSecondary,
        fontWeight: typography.weightBold,
        fontSize: typography.small,
        textAlign: "center",
    },
    addSetButton: {
        marginTop: spacing.sm,
    },
    cardDragging: {
        borderColor: colors.primary,
    },
    headerActions: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
    },
}));
