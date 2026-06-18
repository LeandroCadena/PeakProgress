import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { RoutineExercise, RoutineExerciseSet } from "../../types/workout";
import RoutineExerciseSetRow from "./RoutineExerciseSetRow";

type Props = {
    item: RoutineExercise;
    onEdit: () => void;
    onDelete: () => void;
    isEditing: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    sets: RoutineExerciseSet[];
    onUpdateSet: (setId: string, field: "weight" | "reps", value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (routineExerciseId: string, setId: string) => void;
    updateLocalTemplateSetValue: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
};

export default function RoutineExerciseCard({
    item,
    onEdit,
    onDelete,
    isEditing,
    onMoveUp,
    onMoveDown,
    sets,
    onUpdateSet,
    onAddSet,
    onDeleteSet,
    updateLocalTemplateSetValue,
}: Props) {
    return (
        <View style={styles.card}>
            {item.exercise?.image_url ? (
                <Image
                    source={{ uri: item.exercise.image_url }}
                    style={styles.exerciseImage}
                />
            ) : null}

            <Text style={styles.cardTitle}>
                {item.exercise?.name ?? "Exercise"}
            </Text>

            <View style={styles.setHeader}>
                <Text style={styles.setNumberHeader}>Set</Text>
                <Text style={styles.setHeaderText}>Weight</Text>
                <Text style={styles.setHeaderText}>Reps</Text>
                {isEditing ? <Text style={styles.setHeaderText}></Text> : null}
            </View>

            {sets.map((set) => (
                <RoutineExerciseSetRow
                    key={set.id}
                    set={set}
                    isEditing={isEditing}
                    onDraftChange={(field, value) =>
                        updateLocalTemplateSetValue(set.id, field, value)
                    }
                    onUpdate={(field, value) => onUpdateSet(set.id, field, value)}
                    onDelete={() => onDeleteSet(item.id, set.id)}
                />
            ))}

            {isEditing ? (
                <Pressable style={styles.addSetButton} onPress={onAddSet}>
                    <Text style={styles.addSetText}>+ Add Set</Text>
                </Pressable>
            ) : null}

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
    setHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
        marginBottom: 6,
    },
    setNumberHeader: {
        width: 28,
        color: "#9CA3AF",
        fontSize: 12,
        fontWeight: "700",
    },
    setHeaderText: {
        flex: 1,
        color: "#9CA3AF",
        fontSize: 12,
        fontWeight: "700",
    },
    addSetButton: {
        backgroundColor: "#102A1A",
        borderWidth: 1,
        borderColor: "#4CAF50",
        borderRadius: 10,
        paddingVertical: 10,
        marginTop: 10,
        alignItems: "center",
    },

    addSetText: {
        color: "#4CAF50",
        fontWeight: "700",
    },
    exerciseImage: {
        width: "100%",
        height: 130,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: "#0B0F14",
    },
});