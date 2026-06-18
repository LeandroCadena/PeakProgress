import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { RoutineExerciseSet } from "../../types/workout";
import { displayZeroAsEmpty, sanitizeIntegerInput } from "../../utils/numberInput";

type Props = {
    set: RoutineExerciseSet;
    isEditing: boolean;
    onDraftChange: (field: "weight" | "reps", value: string) => void;
    onUpdate: (field: "weight" | "reps", value: string) => void;
    onDelete: () => void;
};

export default function RoutineExerciseSetRow({
    set,
    isEditing,
    onDraftChange,
    onUpdate,
    onDelete,
}: Props) {
    const [weightValue, setWeightValue] = useState(
        displayZeroAsEmpty(set.weight)
    );

    const [repsValue, setRepsValue] = useState(
        displayZeroAsEmpty(set.reps)
    );

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
            <Text style={styles.setNumber}>{set.set_number}</Text>

            <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={weightValue}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={handleWeightChange}
                onEndEditing={() => onUpdate("weight", weightValue)}
            />

            <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={repsValue}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={handleRepsChange}
                onEndEditing={() => onUpdate("reps", repsValue)}
            />

            {isEditing ? (
                <Pressable style={styles.deleteButton} onPress={onDelete}>
                    <Text style={styles.deleteText}>X</Text>
                </Pressable>
            ) : null}
        </View>
    );
}
const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    setNumber: {
        width: 28,
        color: "#9CA3AF",
        fontWeight: "700",
    },
    input: {
        flex: 1,
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    disabledInput: {
        opacity: 0.6,
    },
    deleteButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    deleteText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
});