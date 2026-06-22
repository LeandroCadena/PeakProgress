import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, componentStyles } from "../../theme";
import { WorkoutSessionSet } from "../../types/workout";
import { sanitizeIntegerInput } from "../../utils/numberInput";

type WorkoutSetRowProps = {
    set: WorkoutSessionSet;
    isPersonalRecord?: boolean;
    displaySetNumber: number;
    weightValue: string;
    repsValue: string;
    isTemporarySet?: boolean;
    onWeightChange: (value: string) => void;
    onRepsChange: (value: string) => void;
    onWeightBlur: (value: string) => void;
    onRepsBlur: (value: string) => void;
    onToggleCompleted: () => void;
    onDelete: () => void;
};

export default function WorkoutSetRow({
    set,
    weightValue,
    repsValue,
    onWeightChange,
    onRepsChange,
    onWeightBlur,
    onRepsBlur,
    onToggleCompleted,
    onDelete,
    isPersonalRecord,
    displaySetNumber,
    isTemporarySet,
}: WorkoutSetRowProps) {
    return (
        <View style={[
            styles.setTableRow,
            isPersonalRecord && styles.personalRecordRow,
        ]}>
            <Text style={styles.setNumber}>{displaySetNumber}</Text>

            <TextInput
                style={[
                    styles.setInput,
                    set.is_completed && styles.disabledInput,
                ]}
                keyboardType="numeric"
                value={weightValue}
                editable={!set.is_completed}
                onChangeText={(value) => onWeightChange(sanitizeIntegerInput(value))}
                onEndEditing={(event) =>
                    onWeightBlur(event.nativeEvent.text)
                }
            />

            <TextInput
                style={[
                    styles.setInput,
                    set.is_completed && styles.disabledInput,
                ]}
                keyboardType="numeric"
                value={repsValue}
                editable={!set.is_completed}
                onChangeText={(value) => onRepsChange(sanitizeIntegerInput(value))}
                onEndEditing={(event) =>
                    onRepsBlur(event.nativeEvent.text)
                }
            />

            {isPersonalRecord ? (
                <Text style={styles.personalRecordText}>🏆 New PR</Text>
            ) : null}

            <Pressable
                style={[
                    styles.checkbox,
                    set.is_completed && styles.checkboxChecked,
                ]}
                onPress={onToggleCompleted}
                disabled={isTemporarySet}
            >
                <Text style={styles.checkboxText}>
                    {set.is_completed ? "✓" : ""}
                </Text>
            </Pressable>

            <Pressable
                style={styles.deleteSetButton}
                onPress={onDelete}
                disabled={isTemporarySet}
            >
                <Text style={styles.deleteSetText}>X</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    setTableRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    setNumber: {
        width: 28,
        color: colors.textSecondary,
        fontWeight: "700",
    },
    setInput: {
        flex: 1,
        backgroundColor: colors.inputBackground,
        color: colors.text,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
    },
    disabledInput: {
        opacity: 0.5,
    },
    checkbox: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.success,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: colors.success,
    },
    checkboxText: {
        color: colors.text,
        fontWeight: "800",
    },
    deleteSetButton: {
        backgroundColor: colors.danger,
        paddingVertical: spacing.sm - 2,
        paddingHorizontal: spacing.md - 2,
        borderRadius: 8,
    },
    deleteSetText: {
        color: colors.text,
        fontWeight: "700",
        fontSize: typography.small,
    },
    personalRecordRow: {
        backgroundColor: colors.warningDark,
        borderColor: colors.warning,
        borderWidth: componentStyles.borderWidth,
        borderRadius: 10,
        padding: spacing.xs,
    },
    personalRecordText: {
        color: colors.warning,
        fontWeight: "800",
        marginTop: spacing.sm,
    },
});