import { View, Text, StyleSheet, Image } from "react-native";

import { colors, spacing, typography } from "../../theme";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../../types/workout";
import AppButton from "../common/AppButton";
import Card from "../common/Card";

import RestTimeEditor from "./RestTimeEditor";
import WorkoutSetRow from "./WorkoutSetRow";

type WorkoutExerciseCardProps = {
    exercise: WorkoutSessionExercise;
    savedSets: WorkoutSessionSet[];
    getSetInputValue: (setId: string, field: "weight" | "reps", value: number | null) => string;
    updateLocalSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
    updateSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
    toggleSetCompleted: (workoutSessionExerciseId: string, set: WorkoutSessionSet) => void;
    deleteSet: (setId: string) => void;
    addEmptySet: (exerciseId: string) => void;
    onDeleteExercise: () => void;
    onUpdateSetRest: (workoutSessionExerciseId: string, value: number) => void;
    useGlobalTimers: boolean;
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
    useGlobalTimers,
}: WorkoutExerciseCardProps) {
    const exerciseName = exercise.exercise_name_snapshot ?? "Exercise";

    return (
        <Card>
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
                editable={!useGlobalTimers}
                onChange={(value) => onUpdateSetRest(exercise.id, value)}
            />

            <View style={styles.setTableHeader}>
                <Text style={styles.setNumberHeader}>Set</Text>
                <Text style={styles.setHeaderText}>weights</Text>
                <Text style={styles.setHeaderText}>reps</Text>
                <Text style={styles.setHeaderText}>Done</Text>
                <Text style={styles.setHeaderText}></Text>
            </View>

            {savedSets.map((set, index) => {
                const isTemporarySet = set.id.startsWith("temp-");
                return (
                    <WorkoutSetRow
                        key={set.id}
                        set={set}
                        isPersonalRecord={Boolean(set.is_completed && set.is_pr)}
                        displaySetNumber={index + 1}
                        weightValue={getSetInputValue(set.id, "weight", set.weight)}
                        repsValue={getSetInputValue(set.id, "reps", set.reps)}
                        onWeightChange={(value) => updateLocalSetValue(set.id, "weight", value)}
                        onRepsChange={(value) => updateLocalSetValue(set.id, "reps", value)}
                        onWeightBlur={(value) => updateSetValue(set.id, "weight", value)}
                        onRepsBlur={(value) => updateSetValue(set.id, "reps", value)}
                        onToggleCompleted={() => toggleSetCompleted(exercise.id, set)}
                        onDelete={() => deleteSet(set.id)}
                        isTemporarySet={isTemporarySet}
                    />
                );
            })}

            <AppButton
                title="+ Add Set"
                variant="success"
                onPress={() => addEmptySet(exercise.id)}
            />

            <AppButton title="Remove Exercise" variant="danger" onPress={onDeleteExercise} />
        </Card>
    );
}

const styles = StyleSheet.create({
    cardTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "700",
    },
    setTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    setHeaderText: {
        flex: 1,
        color: colors.textSecondary,
        fontWeight: "700",
        fontSize: typography.small,
    },
    setNumberHeader: {
        width: 28,
        color: colors.textSecondary,
        fontSize: typography.small,
        fontWeight: "700",
    },
    exerciseImage: {
        width: "100%",
        height: 130,
        borderRadius: 12,
        marginBottom: spacing.md,
        backgroundColor: colors.background,
    },
});
