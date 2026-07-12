import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { colors, componentStyles, spacing, typography } from "../../theme";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";
import AppButton from "../common/AppButton";
import Card from "../common/Card";
import ExerciseCardHeader from "../exercise/ExerciseCardHeader";
import RestTimeEditor from "../workout/RestTimeEditor";

import RoutineExerciseSetRow from "./RoutineExerciseSetRow";

type Props = {
    item: RoutineExercise;
    onDelete: () => void;
    isEditing: boolean;
    onDrag: () => void;
    isDragging: boolean;
    sets: RoutineExerciseSet[];
    onUpdateSet: (setId: string, field: "weight" | "reps", value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (routineExerciseId: string, setId: string) => void;
    onUpdateSetRest: (routineExerciseId: string, value: number) => void;
    updateLocalTemplateSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
};

export default function RoutineExerciseCard({
    item,
    isEditing,
    onDrag,
    isDragging,
    sets,
    onUpdateSet,
    onAddSet,
    onDeleteSet,
    updateLocalTemplateSetValue,
    onUpdateSetRest,
}: Props) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Card
            style={[
                styles.card,
                isDragging && styles.cardDragging,
            ]}
        >
            <Pressable
                onPress={() => {
                    if (!isDragging) {
                        setIsCollapsed((prev) => !prev);
                    }
                }}
            >
                <ExerciseCardHeader
                    imageUrl={item.exercise?.image_url}
                    title={item.exercise?.name ?? "Exercise"}
                    rightContent={
                        <View style={styles.headerActions}>
                            {isEditing ? (
                                <Pressable
                                    onLongPress={onDrag}
                                    delayLongPress={250}
                                    disabled={isDragging}
                                    hitSlop={12}
                                >
                                    <Ionicons
                                        name="reorder-three-outline"
                                        size={28}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                            ) : null}

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
                        label="Rest between sets"
                        value={item.rest_seconds ?? 90}
                        editable={isEditing}
                        onChange={(value) => onUpdateSetRest(item.id, value)}
                    />
                    <View style={styles.setHeader}>
                        <Text style={styles.setNumberHeader}>Set</Text>
                        <Text style={styles.setHeaderText}>Weight</Text>
                        <Text style={styles.setHeaderText}>Reps</Text>
                        {isEditing ? <View style={styles.deleteColumn} /> : null}
                    </View>

                    {sets.map((set, index) => {
                        const isTemporarySet = set.id.startsWith("temp-");
                        return (
                            <RoutineExerciseSetRow
                                key={set.id}
                                set={set}
                                isEditing={isEditing}
                                displaySetNumber={index + 1}
                                onDraftChange={(field, value) =>
                                    updateLocalTemplateSetValue(set.id, field, value)
                                }
                                onUpdate={(field, value) => onUpdateSet(set.id, field, value)}
                                onDelete={() => onDeleteSet(item.id, set.id)}
                                isTemporarySet={isTemporarySet}
                            />
                        );
                    })}

                    {isEditing ? (
                        <AppButton
                            style={styles.addButton}
                            title="+ Add Set"
                            variant="success"
                            onPress={onAddSet}
                        />
                    ) : null}
                </>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    setHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    addButton: {
        marginTop: spacing.md,
    },
    deleteColumn: {
        width: componentStyles.iconButtonSize,
    },
    setNumberHeader: {
        width: 28,
        color: colors.textSecondary,
        fontSize: typography.caption,
        fontWeight: typography.weightBold,
    },
    setHeaderText: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: typography.small,
        fontWeight: typography.weightBold,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    card: {
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
    },
    cardDragging: {
        borderColor: colors.primary,
    },
});
