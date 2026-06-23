import { View, Pressable, Text, StyleSheet } from "react-native";

import { colors, spacing, componentStyles } from "../../theme";
import { WorkoutSessionSet } from "../../types/workout";
import { sanitizeIntegerInput } from "../../utils/numberInput";
import AppInput from "../common/AppInput";

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
        <View style={styles.row}>
            <Text style={styles.setNumber}>{displaySetNumber}</Text>

            <AppInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={weightValue}
                disabled={set.is_completed}
                onChangeText={(value) => onWeightChange(sanitizeIntegerInput(value))}
                onEndEditing={(event) => onWeightBlur(event.nativeEvent.text)}
            />

            <AppInput
                style={styles.repsInput}
                keyboardType="numeric"
                value={repsValue}
                disabled={set.is_completed}
                onChangeText={(value) => onRepsChange(sanitizeIntegerInput(value))}
                onEndEditing={(event) => onRepsBlur(event.nativeEvent.text)}
            />

            <Pressable
                style={[
                    styles.checkbox,
                    set.is_completed && styles.checkboxChecked,
                    isPersonalRecord && styles.personalRecordCheckbox,
                ]}
                onPress={onToggleCompleted}
                disabled={isTemporarySet}
            >
                <Text style={styles.checkboxText}>{set.is_completed ? "✓" : ""}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    setNumber: {
        width: 22,
        color: colors.textSecondary,
        fontWeight: "700",
    },
    weightInput: {
        flex: 1,
        height: 36,
        width: 80,
        paddingVertical: 0,
    },
    repsInput: {
        flex: 1,
        height: 36,
        width: 80,
        paddingVertical: 0,
    },
    checkbox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.success,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: colors.success,
    },
    personalRecordCheckbox: {
        borderColor: colors.warning,
        backgroundColor: colors.warningDark,
    },
    checkboxText: {
        color: colors.text,
        fontWeight: "800",
    },
});
