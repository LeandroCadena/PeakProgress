import { View, Text, Pressable, StyleSheet } from "react-native";
import { RoutineExercise } from "../../types/workout";

type Props = {
    item: RoutineExercise;
    onEdit: () => void;
    onDelete: () => void;
};

export default function RoutineExerciseCard({ item, onEdit, onDelete }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>
                {item.exercise?.name ?? "Exercise"}
            </Text>

            <Text style={styles.cardText}>
                {item.sets} sets · {item.reps} reps · {item.weight ?? 0} kg ·{" "}
                {item.rest_seconds}s rest
            </Text>

            <View style={styles.cardActions}>
                <Pressable style={styles.editButton} onPress={onEdit}>
                    <Text style={styles.actionText}>Edit</Text>
                </Pressable>

                <Pressable style={styles.deleteButton} onPress={onDelete}>
                    <Text style={styles.actionText}>Delete</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    cardActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    editButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        paddingVertical: 10,
        borderRadius: 10,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: "#EF4444",
        paddingVertical: 10,
        borderRadius: 10,
    },
    actionText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});