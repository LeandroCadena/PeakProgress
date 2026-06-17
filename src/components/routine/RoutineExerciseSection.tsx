import { View, Text, StyleSheet } from "react-native";
import { RoutineExercise } from "../../types/workout";
import RoutineExerciseCard from "./RoutineExerciseCard";

type Props = {
    routineExercises: RoutineExercise[];
    onEdit: (item: RoutineExercise) => void;
    onDelete: (routineExerciseId: string) => void;
};

export default function RoutineExerciseSection({
    routineExercises,
    onEdit,
    onDelete,
}: Props) {
    return (
        <>
            <Text style={styles.sectionTitle}>Current exercises</Text>

            {routineExercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises added yet.</Text>
            ) : (
                <View style={styles.list}>
                    {routineExercises.map((item) => (
                        <RoutineExerciseCard
                            key={item.id}
                            item={item}
                            onEdit={() => onEdit(item)}
                            onDelete={() => onDelete(item.id)}
                        />
                    ))}
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
        marginBottom: 12,
    },
    emptyText: {
        color: "#9CA3AF",
    },
    list: {
        gap: 12,
        paddingBottom: 12,
    },
});