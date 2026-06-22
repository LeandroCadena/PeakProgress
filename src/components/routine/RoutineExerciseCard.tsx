import { View, Text, StyleSheet, Image } from "react-native";
import RoutineExerciseSetRow from "./RoutineExerciseSetRow";
import RestTimeEditor from "../workout/RestTimeEditor";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";
import { colors, spacing, typography } from "../../theme";
import AppButton from "../common/AppButton";
import Card from "../common/Card";
import IconButton from "../common/IconButton";

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
        <Card>
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
                <AppButton
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
                        <IconButton
                            icon="↑"
                            onPress={onMoveUp}
                        />

                        <IconButton
                            icon="↓"
                            onPress={onMoveDown}
                        />
                    </View>
                </>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    cardTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "700",
    },
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
    exerciseImage: {
        width: "100%",
        height: 130,
        borderRadius: 12,
        marginBottom: spacing.md,
        backgroundColor: colors.background,
    },
});