import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = {
    onEdit: () => void;
    onDelete: () => void;
};

export default function RoutineActions({ onEdit, onDelete }: Props) {
    return (
        <View style={styles.routineActions}>
            <Pressable style={styles.editRoutineButton} onPress={onEdit}>
                <Text style={styles.actionText}>Edit Routine</Text>
            </Pressable>

            <Pressable style={styles.deleteRoutineButton} onPress={onDelete}>
                <Text style={styles.actionText}>Delete Routine</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    routineActions: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    editRoutineButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        paddingVertical: 12,
        borderRadius: 12,
    },
    deleteRoutineButton: {
        flex: 1,
        backgroundColor: "#EF4444",
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});