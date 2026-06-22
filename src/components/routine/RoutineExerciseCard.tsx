import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import RoutineExerciseSetRow from "./RoutineExerciseSetRow";
import RestTimeEditor from "../workout/RestTimeEditor";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";
import { colors, spacing, typography } from "../../theme";

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
    updateLocalTemplateSetValue: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
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
    return (
        <View style={styles.card}>
            {item.exercise?.image_url ? (
                <Image
                    source={{ uri: item.exercise.image_url }}
                    style={styles.exerciseImage}
                />
            ) : null}

            <Text style={styles.cardTitle}>
                {item.exercise?.name ?? "Exercise"}
            </Text>

            <View style={styles.setHeader}>
                <Text style={styles.setNumberHeader}>Set</Text>
                <Text style={styles.setHeaderText}>Weight</Text>
                <Text style={styles.setHeaderText}>Reps</Text>
                {isEditing ? <Text style={styles.setHeaderText}></Text> : null}
            </View>

            <RestTimeEditor
                label="Rest between sets"
                value={item.rest_seconds ?? 90}
                editable={isEditing}
                onChange={(value) => onUpdateSetRest(item.id, value)}
            />

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
                )
            })}

            {isEditing ? (
                <Pressable
                    style={styles.addSetButton}
                    onPress={onAddSet}
                >
                    <Text style={styles.addSetText}>+ Add Set</Text>
                </Pressable>
            ) : null}

            {isEditing ? (
                <>
                    <View style={styles.cardActions}>
                        <Pressable style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.actionText}>Delete</Text>
                        </Pressable>
                    </View>

                    <View style={styles.moveActions}>
                        <Pressable style={styles.moveButton} onPress={onMoveUp}>
                            <Text style={styles.moveText}>↑</Text>
                        </Pressable>

                        <Pressable style={styles.moveButton} onPress={onMoveDown}>
                            <Text style={styles.moveText}>↓</Text>
                        </Pressable>
                    </View>
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        padding: spacing.lg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    cardTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "700",
    },
    cardText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    cardActions: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    editButton: {
        flex: 1,
        backgroundColor: colors.primaryPressed,
        paddingVertical: spacing.md,
        borderRadius: 10,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: colors.danger,
        paddingVertical: spacing.md,
        borderRadius: 10,
    },
    actionText: {
        color: colors.text,
        fontWeight: "700",
        textAlign: "center",
    },
    moveActions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    moveButton: {
        flex: 1,
        backgroundColor: colors.inputBorder,
        paddingVertical: spacing.md,
        borderRadius: 10,
    },
    moveText: {
        color: colors.text,
        textAlign: "center",
        fontWeight: "800",
        fontSize: typography.body,
    },
    setHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    setNumberHeader: {
        width: 28,
        color: colors.textSecondary,
        fontSize: typography.caption,
        fontWeight: "700",
    },
    setHeaderText: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: typography.caption,
        fontWeight: "700",
    },
    addSetButton: {
        backgroundColor: colors.successDark,
        borderWidth: 1,
        borderColor: colors.success,
        borderRadius: 10,
        paddingVertical: spacing.md,
        marginTop: spacing.md,
        alignItems: "center",
    },

    addSetText: {
        color: colors.success,
        fontWeight: "700",
    },
    exerciseImage: {
        width: "100%",
        height: 130,
        borderRadius: 12,
        marginBottom: spacing.md,
        backgroundColor: colors.background,
    },
});