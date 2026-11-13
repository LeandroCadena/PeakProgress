import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { useLanguage } from "../../i18n/LanguageProvider";
import { componentStyles, spacing, typography, useAppTheme, createThemedStyles } from "../../theme";
import { RoutineExerciseSet } from "../../types/routine";
import {
    displayZeroAsEmpty,
    sanitizeIntegerInput,
    sanitizeWeightInput,
} from "../../utils/numberInput";
import SetInput from "../common/SetInput";
import SwipeableCard from "../common/SwipeableCard";

type Props = {
    set: RoutineExerciseSet;
    displaySetNumber: number;
    onDraftChange: (field: "weight" | "reps", value: string) => void;
    onUpdate: (field: "weight" | "reps", value: string) => void;
    onDelete: () => void;
    isTemporarySet?: boolean;
};

export default function RoutineExerciseSetRow({
    set,
    displaySetNumber,
    onDraftChange,
    onUpdate,
    onDelete,
    isTemporarySet,
}: Props) {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const [weightValue, setWeightValue] = useState(displayZeroAsEmpty(set.weight));

    const [repsValue, setRepsValue] = useState(displayZeroAsEmpty(set.reps));

    useEffect(() => {
        setWeightValue(displayZeroAsEmpty(set.weight));

        setRepsValue(displayZeroAsEmpty(set.reps));
    }, [set.id, set.weight, set.reps]);

    function handleWeightChange(value: string) {
        const sanitizedValue = sanitizeWeightInput(value);

        setWeightValue(sanitizedValue);

        onDraftChange("weight", sanitizedValue);
    }

    function handleRepsChange(value: string) {
        const sanitizedValue = sanitizeIntegerInput(value);

        setRepsValue(sanitizedValue);

        onDraftChange("reps", sanitizedValue);
    }

    return (
        <SwipeableCard compact enabled={!isTemporarySet} onActionPress={onDelete}>
            <View style={styles.row}>
                <Text style={styles.setNumber}>{displaySetNumber}</Text>

                <SetInput
                    style={styles.setRow}
                    value={weightValue}
                    accessibilityLabel={t("weight")}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    onChangeText={handleWeightChange}
                    onEndEditing={() => onUpdate("weight", weightValue)}
                />

                <View style={styles.repsContainer}>
                    <SetInput
                        style={styles.setRow}
                        value={repsValue}
                        accessibilityLabel={t("reps")}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        onChangeText={handleRepsChange}
                        onEndEditing={() => onUpdate("reps", repsValue)}
                    />
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
    repsContainer: {
        flex: 1,
        marginRight: spacing.md,
    },
}));
