import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
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
    personalRecordRow: {
        backgroundColor: "#3A2A00",
        borderColor: "#FBBF24",
        borderWidth: 1,
    },
    personalRecordText: {
        color: "#FBBF24",
        fontWeight: "800",
        marginTop: 6,
    },
    setNumber: {
        width: 28,
        color: "#9CA3AF",
        fontWeight: "700",
    },
});