import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../../types/workout";
import WorkoutSetRow from "./WorkoutSetRow";
import RestTimeEditor from "./RestTimeEditor";

type WorkoutExerciseCardProps = {
    exercise: WorkoutSessionExercise;
    savedSets: WorkoutSessionSet[];
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
    toggleSetCompleted: (
        workoutSessionExerciseId: string,
        set: WorkoutSessionSet
    ) => void;
    deleteSet: (setId: string) => void;
    addEmptySet: (exerciseId: string) => void;
    onDeleteExercise: () => void;
    onUpdateSetRest: (
        workoutSessionExerciseId: string,
        value: number
    ) => void;
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
    onDeleteExercise,
    onUpdateSetRest,
}: WorkoutExerciseCardProps) {
    const exerciseName = exercise.exercise_name_snapshot ?? "Exercise";

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{exerciseName}</Text>

            {exercise.exercise_image_url_snapshot ? (
                <Image
                    source={{ uri: exercise.exercise_image_url_snapshot }}
                    style={styles.exerciseImage}
                />
            ) : null}

            <RestTimeEditor
                label="Rest between sets"
                value={exercise.rest_seconds ?? 90}
                editable
                onChange={(value) => onUpdateSetRest(exercise.id, value)}
            />

            <Text style={styles.cardText}>
                Rest: {exercise.rest_seconds}s
            </Text>

            <Text style={styles.cardText}>
                Saved sets: {savedSets.length}
            </Text>

            <View style={styles.setTableHeader}>
                <Text style={styles.setHeaderText}>weights</Text>
                <Text style={styles.setHeaderText}>reps</Text>
                <Text style={styles.setHeaderText}>Done</Text>
                <Text style={styles.setHeaderText}></Text>
            </View>

            {savedSets.map((set) => {
                return (
                    <WorkoutSetRow
                        key={set.id}
                        set={set}
                        isPersonalRecord={Boolean(set.is_completed && set.is_pr)}
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
                        onToggleCompleted={() => toggleSetCompleted(exercise.id, set)}
                        onDelete={() => deleteSet(set.id)}
                    />
                );
            })}

            <Pressable
                style={styles.addSetRow}
                onPress={() => addEmptySet(exercise.id)}
            >
                <Text style={styles.addSetText}>+ Add Set</Text>
            </Pressable>

            <Pressable style={styles.deleteExerciseButton} onPress={onDeleteExercise}>
                <Text style={styles.deleteExerciseText}>Remove Exercise</Text>
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
    deleteExerciseButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 12,
    },
    deleteExerciseText: {
        color: "#FFFFFF",
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