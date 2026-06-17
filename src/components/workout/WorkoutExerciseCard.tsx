import { View, Text, Pressable, StyleSheet } from "react-native";
import { RoutineExercise, SavedSet } from "../../types/workout";
import WorkoutSetRow from "./WorkoutSetRow";

type WorkoutExerciseCardProps = {
    exercise: RoutineExercise;
    savedSets: SavedSet[];
    getSetInputValue: (
        setId: string,
        field: "weight" | "reps",
        value: number | null
    ) => string;
    updateLocalSetValue: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
    updateSetValue: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
    toggleSetCompleted: (set: SavedSet) => void;
    deleteSet: (setId: string) => void;
    addEmptySet: (exerciseId: string) => void;
};

export default function WorkoutExerciseCard({
    exercise,
    savedSets,
    getSetInputValue,
    updateLocalSetValue,
    updateSetValue,
    toggleSetCompleted,
    deleteSet,
    addEmptySet,
}: WorkoutExerciseCardProps) {
    const exerciseName = exercise.exercise?.name ?? "Exercise";

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{exerciseName}</Text>

            <Text style={styles.cardText}>
                Target: {exercise.sets} sets · {exercise.reps} reps ·{" "}
                {exercise.rest_seconds}s rest
            </Text>

            <Text style={styles.cardText}>
                Saved sets: {savedSets.length}/{exercise.sets}
            </Text>

            <View style={styles.setTableHeader}>
                <Text style={styles.setHeaderText}>weights</Text>
                <Text style={styles.setHeaderText}>reps</Text>
                <Text style={styles.setHeaderText}>Done</Text>
                <Text style={styles.setHeaderText}></Text>
            </View>

            {savedSets.map((set) => (
                <WorkoutSetRow
                    key={set.id}
                    set={set}
                    weightValue={getSetInputValue(set.id, "weight", set.weight)}
                    repsValue={getSetInputValue(set.id, "reps", set.reps)}
                    onWeightChange={(value) =>
                        updateLocalSetValue(set.id, "weight", value)
                    }
                    onRepsChange={(value) =>
                        updateLocalSetValue(set.id, "reps", value)
                    }
                    onWeightBlur={(value) =>
                        updateSetValue(set.id, "weight", value)
                    }
                    onRepsBlur={(value) =>
                        updateSetValue(set.id, "reps", value)
                    }
                    onToggleCompleted={() => toggleSetCompleted(set)}
                    onDelete={() => deleteSet(set.id)}
                />
            ))}

            <Pressable
                style={styles.addSetRow}
                onPress={() => addEmptySet(exercise.exercise_id)}
            >
                <Text style={styles.addSetText}>+ Add Set</Text>
            </Pressable>
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
        fontSize: 18,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 14,
    },
    setTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 8,
        gap: 8,
    },
    setHeaderText: {
        flex: 1,
        color: "#9CA3AF",
        fontWeight: "700",
        fontSize: 12,
    },
    addSetRow: {
        backgroundColor: "#102A1A",
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        marginTop: 6,
    },
    addSetText: {
        color: "#4CAF50",
        fontWeight: "800",
    },
});