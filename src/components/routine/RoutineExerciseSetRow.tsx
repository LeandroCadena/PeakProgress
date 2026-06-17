import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { RoutineExerciseSet } from "../../types/workout";

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
    const [weightValue, setWeightValue] = useState(String(set.weight ?? 0));
    const [repsValue, setRepsValue] = useState(String(set.reps ?? 0));

    useEffect(() => {
        setWeightValue(String(set.weight ?? 0));
        setRepsValue(String(set.reps ?? 0));
    }, [set.id, set.weight, set.reps]);

    function handleWeightChange(value: string) {
        setWeightValue(value);
        onDraftChange("weight", value);
    }

    function handleRepsChange(value: string) {
        setRepsValue(value);
        onDraftChange("reps", value);
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