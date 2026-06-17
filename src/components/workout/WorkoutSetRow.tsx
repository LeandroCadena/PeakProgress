import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { SavedSet } from "../../types/workout";

type WorkoutSetRowProps = {
    set: SavedSet;
    weightValue: string;
    repsValue: string;
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
}: WorkoutSetRowProps) {
    return (
        <View style={styles.setTableRow}>
            <TextInput
                style={[
                    styles.setInput,
                    set.is_completed && styles.disabledInput,
                ]}
                keyboardType="numeric"
                value={weightValue}
                editable={!set.is_completed}
                onChangeText={onWeightChange}
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
                onChangeText={onRepsChange}
                onEndEditing={(event) =>
                    onRepsBlur(event.nativeEvent.text)
                }
            />

            <Pressable
                style={[
                    styles.checkbox,
                    set.is_completed && styles.checkboxChecked,
                ]}
                onPress={onToggleCompleted}
            >
                <Text style={styles.checkboxText}>
                    {set.is_completed ? "✓" : ""}
                </Text>
            </Pressable>

            <Pressable
                style={styles.deleteSetButton}
                onPress={onDelete}
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
        gap: 8,
        marginBottom: 8,
    },
    setInput: {
        flex: 1,
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    disabledInput: {
        opacity: 0.5,
    },
    checkbox: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: "#4CAF50",
    },
    checkboxText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
    deleteSetButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    deleteSetText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12,
    },
});