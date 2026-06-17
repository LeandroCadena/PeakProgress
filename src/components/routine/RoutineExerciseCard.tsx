import { View, Text, Pressable, StyleSheet } from "react-native";
import { RoutineExercise } from "../../types/workout";

type Props = {
    item: RoutineExercise;
    onEdit: () => void;
    onDelete: () => void;
    isEditing: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
};

export default function RoutineExerciseCard({
    item,
    onEdit,
    onDelete,
    isEditing,
    onMoveUp,
    onMoveDown
}: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>
                {item.exercise?.name ?? "Exercise"}
            </Text>

            <Text style={styles.cardText}>
                {item.sets} sets · {item.reps} reps · {item.weight ?? 0} kg ·{" "}
                {item.rest_seconds}s rest
            </Text>

            {isEditing ? (
                <>
                    <View style={styles.cardActions}>
                        <Pressable style={styles.editButton} onPress={onEdit}>
                            <Text style={styles.actionText}>Edit</Text>
                        </Pressable>

                        <Pressable style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.actionText}>Delete</Text>
                        </Pressable>
                    </View>

                    <View style={styles.moveActions}>
                        <Pressable style={styles.moveButton} onPress={onMoveUp}>
                            <Text style={styles.moveText}>↑</Text>
                        </Pressable>

                        <Pressable style={styles.moveButton} onPress={onMoveDown}>
                            <Text style={styles.moveText}>↓</Text>
                        </Pressable>
                    </View>
                </>
            ) : null}
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
    moveActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    moveButton: {
        flex: 1,
        backgroundColor: "#374151",
        paddingVertical: 10,
        borderRadius: 10,
    },
    moveText: {
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "800",
        fontSize: 16,
    },
});