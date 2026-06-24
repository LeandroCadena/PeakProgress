import { View, Text, StyleSheet } from "react-native";

import { colors, sharedStyles, spacing, typography } from "../../theme";
import { WorkoutSessionSet, WorkoutSessionExercise } from "../../types/workout";
import AppButton from "../common/AppButton";
import Card from "../common/Card";
import ExerciseCardHeader from "../exercise/ExerciseCardHeader";

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
        <Card style={styles.card}>
            <ExerciseCardHeader
                imageUrl={exercise.exercise_image_url_snapshot}
                title={exerciseName}
            />

            <Text style={sharedStyles.mutedText}>
                Rest between sets: {exercise.rest_seconds ?? 90} sec
            </Text>

            <View style={styles.divider} />

            <View style={styles.setTableHeader}>
                <Text style={styles.setNumberHeader}>Set</Text>
                <Text style={styles.setHeaderText}>Weight</Text>
                <Text style={styles.setHeaderText}>Reps</Text>
                <Text style={styles.doneHeader}>Done</Text>
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
                style={styles.addSetButton}
            />
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: colors.cardBorder,
    },
    setTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    setNumberHeader: {
        width: 22,
        color: colors.textSecondary,
        fontSize: typography.small,
        fontWeight: typography.weightBold,
    },
    setHeaderText: {
        flex: 1,
        color: colors.textSecondary,
        fontWeight: typography.weightBold,
        fontSize: typography.small,
    },
    doneHeader: {
        width: 36,
        color: colors.textSecondary,
        fontWeight: typography.weightBold,
        fontSize: typography.small,
        textAlign: "center",
    },
    addSetButton: {
        marginTop: spacing.sm,
    },
});
