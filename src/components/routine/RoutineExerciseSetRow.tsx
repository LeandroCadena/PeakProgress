import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { RoutineExerciseSet } from "../../types/workout";

type Props = {
    set: RoutineExerciseSet;
    isEditing: boolean;
    onUpdate: (field: "weight" | "reps", value: string) => void;
    onDelete: () => void;
};

export default function RoutineExerciseSetRow({
    set,
    isEditing,
    onUpdate,
    onDelete,
}: Props) {
    const [weightValue, setWeightValue] = useState(String(set.weight ?? 0));
    const [repsValue, setRepsValue] = useState(String(set.reps));

    useEffect(() => {
        setWeightValue(String(set.weight ?? 0));
        setRepsValue(String(set.reps));
    }, [set.weight, set.reps]);

    return (
        <View style={styles.row}>
            <Text style={styles.setNumber}>{set.set_number}</Text>

            <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={weightValue}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={setWeightValue}
                onEndEditing={() => onUpdate("weight", weightValue)}
            />

            <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={repsValue}
                editable={isEditing}
                keyboardType="numeric"
                onChangeText={setRepsValue}
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