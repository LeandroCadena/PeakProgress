import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { colors, componentStyles, spacing, typography } from "../../theme";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";
import AppButton from "../common/AppButton";
import Card from "../common/Card";
import IconButton from "../common/IconButton";
import ExerciseCardHeader from "../exercise/ExerciseCardHeader";
import RestTimeEditor from "../workout/RestTimeEditor";

import RoutineExerciseSetRow from "./RoutineExerciseSetRow";

type Props = {
    item: RoutineExercise;
    onDelete: () => void;
    isEditing: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    sets: RoutineExerciseSet[];
    onUpdateSet: (setId: string, field: "weight" | "reps", value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (routineExerciseId: string, setId: string) => void;
    onUpdateSetRest: (routineExerciseId: string, value: number) => void;
    updateLocalTemplateSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
};

export default function RoutineExerciseCard({
    item,
    onDelete,
    isEditing,
    onMoveUp,
    onMoveDown,
    sets,
    onUpdateSet,
    onAddSet,
    onDeleteSet,
    updateLocalTemplateSetValue,
    onUpdateSetRest,
}: Props) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <Card>
            <Pressable onPress={() => setIsCollapsed((prev) => !prev)}>
                <ExerciseCardHeader
                    imageUrl={item.exercise?.image_url}
                    title={item.exercise?.name ?? "Exercise"}
                    rightContent={
                        <Ionicons
                            name={isCollapsed ? "chevron-down" : "chevron-up"}
                            size={22}
                            color={colors.text}
                        />
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

                    {isEditing ? (
                        <>
                            <View style={styles.cardActions}>
                                <AppButton
                                    title="Remove Exercise"
                                    variant="danger"
                                    onPress={onDelete}
                                />
                            </View>

                            <View style={styles.moveActions}>
                                <IconButton icon="↑" onPress={onMoveUp} />

                                <IconButton icon="↓" onPress={onMoveDown} />
                            </View>
                        </>
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
    //To be removed
    cardActions: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    moveActions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.md,
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
});
