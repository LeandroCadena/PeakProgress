import { View, Text, StyleSheet } from "react-native";

import { sharedStyles } from "../../theme";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";
import EmptyStateCard from "../common/EmptyStateCard";
import RestTimeEditor from "../workout/RestTimeEditor";

import RoutineExerciseCard from "./RoutineExerciseCard";

type Props = {
    routineExercises: RoutineExercise[];
    onDelete: (routineExerciseId: string) => void;
    isEditing: boolean;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    routineExerciseSets: Record<string, RoutineExerciseSet[]>;
    onUpdateSet: (setId: string, field: "weight" | "reps", value: string) => void;
    onAddSet: (routineExerciseId: string) => void;
    onDeleteSet: (routineExerciseId: string, setId: string) => void;
    onUpdateSetRest: (routineExerciseId: string, value: number) => void;
    onUpdateExerciseRest: (routineExerciseId: string, value: number) => void;
    updateLocalTemplateSetValue: (setId: string, field: "weight" | "reps", value: string) => void;
};

export default function RoutineExerciseSection({
    routineExercises,
    onDelete,
    isEditing,
    onMoveUp,
    onMoveDown,
    routineExerciseSets,
    onUpdateSet,
    onAddSet,
    onDeleteSet,
    updateLocalTemplateSetValue,
    onUpdateSetRest,
    onUpdateExerciseRest,
}: Props) {
    return (
        <>
            <Text style={sharedStyles.sectionTitle}>Current exercises</Text>

            {routineExercises.length === 0 ? (
                <EmptyStateCard
                    title={"No exercises added yet."}
                    message={"Add your first exercise now"}
                />
            ) : (
                <View style={styles.list}>
                    {routineExercises.map((item, index) => (
                        <View key={item.id}>
                            <RoutineExerciseCard
                                item={item}
                                sets={routineExerciseSets[item.id] ?? []}
                                isEditing={isEditing}
                                onAddSet={() => onAddSet(item.id)}
                                onUpdateSet={onUpdateSet}
                                onDeleteSet={onDeleteSet}
                                updateLocalTemplateSetValue={updateLocalTemplateSetValue}
                                onUpdateSetRest={onUpdateSetRest}
                                onDelete={() => onDelete(item.id)}
                                onMoveUp={() => onMoveUp(index)}
                                onMoveDown={() => onMoveDown(index)}
                            />

                            {index < routineExercises.length - 1 ? (
                                <RestTimeEditor
                                    label="Rest before next exercise"
                                    value={item.exercise_rest_seconds ?? 120}
                                    editable={isEditing}
                                    onChange={(value) => onUpdateExerciseRest(item.id, value)}
                                />
                            ) : null}
                        </View>
                    ))}
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 12,
        paddingBottom: 12,
    },
});
