import { View, Pressable, Text } from "react-native";

import { spacing, componentStyles, useAppTheme, createThemedStyles } from "../../theme";
import { WorkoutSessionSet } from "../../types/workout";
import { sanitizeIntegerInput, sanitizeWeightInput } from "../../utils/numberInput";
import AppInput from "../common/AppInput";
import SwipeableCard from "../common/SwipeableCard";

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
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    return (
        <SwipeableCard compact enabled={!isTemporarySet} onActionPress={onDelete}>
            <View style={styles.rowContainer}>
                <View style={styles.row}>
                    <Text style={styles.setNumber}>{displaySetNumber}</Text>

                    <AppInput
                        style={styles.setRow}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        value={weightValue}
                        disabled={set.is_completed}
                        onChangeText={(value) => onWeightChange(sanitizeWeightInput(value))}
                        onEndEditing={(event) =>
                            onWeightBlur(sanitizeWeightInput(event.nativeEvent.text))
                        }
                    />

                    <AppInput
                        style={styles.setRow}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        value={repsValue}
                        disabled={set.is_completed}
                        onChangeText={(value) => onRepsChange(sanitizeIntegerInput(value))}
                        onEndEditing={(event) =>
                            onRepsBlur(sanitizeIntegerInput(event.nativeEvent.text))
                        }
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
            </View>
        </SwipeableCard>
    );
}

const getStyles = createThemedStyles((colors) => ({
    row: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    rowContainer: {
        backgroundColor: colors.inputBackground,
    },
    setNumber: {
        marginLeft: spacing.sm,
        width: 22,
        color: colors.textSecondary,
        fontWeight: "700",
    },
    setRow: {
        flex: 1,
        height: 36,
        paddingVertical: 0,
        marginRight: 30,
    },
    checkbox: {
        width: 36,
        height: 36,
        marginRight: 0,
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
}));
