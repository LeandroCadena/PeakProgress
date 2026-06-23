import { View, Pressable, Text, StyleSheet } from "react-native";

import { colors, spacing, componentStyles } from "../../theme";
import { WorkoutSessionSet } from "../../types/workout";
import { sanitizeIntegerInput } from "../../utils/numberInput";
import AppInput from "../common/AppInput";
import IconButton from "../common/IconButton";

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
        <View style={[styles.setTableRow, isPersonalRecord && styles.personalRecordRow]}>
            <Text style={styles.setNumber}>{displaySetNumber}</Text>

            <AppInput
                style={styles.setInput}
                keyboardType="numeric"
                value={weightValue}
                disabled={set.is_completed}
                onChangeText={(value) => onWeightChange(sanitizeIntegerInput(value))}
                onEndEditing={(event) => onWeightBlur(event.nativeEvent.text)}
            />

            <AppInput
                style={styles.setInput}
                keyboardType="numeric"
                value={repsValue}
                disabled={set.is_completed}
                onChangeText={(value) => onRepsChange(sanitizeIntegerInput(value))}
                onEndEditing={(event) => onRepsBlur(event.nativeEvent.text)}
            />

            {isPersonalRecord ? <Text style={styles.personalRecordText}>🏆 New PR</Text> : null}

            <Pressable
                style={[styles.checkbox, set.is_completed && styles.checkboxChecked]}
                onPress={onToggleCompleted}
                disabled={isTemporarySet}
            >
                <Text style={styles.checkboxText}>{set.is_completed ? "✓" : ""}</Text>
            </Pressable>

            <IconButton icon="X" variant="danger" disabled={isTemporarySet} onPress={onDelete} />
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
