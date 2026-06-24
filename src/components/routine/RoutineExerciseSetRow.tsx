import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { colors, componentStyles, spacing, typography } from "../../theme";
import { RoutineExerciseSet } from "../../types/routine";
import { displayZeroAsEmpty, sanitizeIntegerInput } from "../../utils/numberInput";
import AppInput from "../common/AppInput";
import IconButton from "../common/IconButton";

type Props = {
    set: RoutineExerciseSet;
    isEditing: boolean;
    displaySetNumber: number;
    onDraftChange: (field: "weight" | "reps", value: string) => void;
    onUpdate: (field: "weight" | "reps", value: string) => void;
    onDelete: () => void;
    isTemporarySet?: boolean;
};

export default function RoutineExerciseSetRow({
    set,
    isEditing,
    displaySetNumber,
    onDraftChange,
    onUpdate,
    onDelete,
    isTemporarySet,
}: Props) {
    const [weightValue, setWeightValue] = useState(displayZeroAsEmpty(set.weight));

    const [repsValue, setRepsValue] = useState(displayZeroAsEmpty(set.reps));

    useEffect(() => {
        setWeightValue(displayZeroAsEmpty(set.weight));
        setRepsValue(displayZeroAsEmpty(set.reps));
    }, [set.id, set.weight, set.reps]);

    function handleWeightChange(value: string) {
        const sanitizedValue = sanitizeIntegerInput(value);
        setWeightValue(sanitizedValue);
        onDraftChange("weight", sanitizedValue);
    }

    function handleRepsChange(value: string) {
        const sanitizedValue = sanitizeIntegerInput(value);
        setRepsValue(sanitizedValue);
        onDraftChange("reps", sanitizedValue);
    }

    return (
        <View style={styles.row}>
            <Text style={styles.setNumber}>{displaySetNumber}</Text>

            <AppInput
                style={styles.setRow}
                value={weightValue}
                disabled={!isEditing}
                keyboardType="numeric"
                onChangeText={handleWeightChange}
                onEndEditing={() => onUpdate("weight", weightValue)}
            />

            <AppInput
                style={styles.setRow}
                value={repsValue}
                disabled={!isEditing}
                keyboardType="numeric"
                onChangeText={handleRepsChange}
                onEndEditing={() => onUpdate("reps", repsValue)}
            />

            {isEditing ? (
                <View style={styles.deleteAction}>
                    <IconButton
                        icon="X"
                        variant="danger"
                        disabled={isTemporarySet}
                        onPress={onDelete}
                    />
                </View>
            ) : null}
        </View>
    );
}
const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    setNumber: {
        width: componentStyles.setNumberWidth,
        color: colors.textSecondary,
        fontWeight: typography.weightBold,
    },
    setRow: {
        flex: 1,
        height: 36,
        width: 80,
        paddingVertical: 0,
    },
    deleteAction: {
        width: componentStyles.iconButtonSize,
    },
});
