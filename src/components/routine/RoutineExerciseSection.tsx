import { View, Text, StyleSheet } from "react-native";
import RoutineExerciseCard from "./RoutineExerciseCard";
import RestTimeEditor from "../workout/RestTimeEditor";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";

type Props = {
    routineExercises: RoutineExercise[];
    onDelete: (routineExerciseId: string) => void;
    isEditing: boolean;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    routineExerciseSets: Record<string, RoutineExerciseSet[]>;
    addingSetByExerciseId: Record<string, boolean>;
    onUpdateSet: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
    onAddSet: (routineExerciseId: string) => void;
    onDeleteSet: (routineExerciseId: string, setId: string) => void;
    onUpdateSetRest: (routineExerciseId: string, value: number) => void;
    onUpdateExerciseRest: (routineExerciseId: string, value: number) => void;
    updateLocalTemplateSetValue: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
};

export default function RoutineExerciseSection({
    routineExercises,
    onDelete,
    isEditing,
    onMoveUp,
    onMoveDown,
    routineExerciseSets,
    addingSetByExerciseId,
    onUpdateSet,
    onAddSet,
    onDeleteSet,
    updateLocalTemplateSetValue,
    onUpdateSetRest,
    onUpdateExerciseRest,
}: Props) {
    return (
        <>
            <Text style={styles.sectionTitle}>Current exercises</Text>

            {routineExercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises added yet.</Text>
            ) : (
                <View style={styles.list}>
                    {routineExercises.map((item, index) => (
                        <View key={item.id}>
                            <RoutineExerciseCard
                                item={item}
                                sets={routineExerciseSets[item.id] ?? []}
                                isEditing={isEditing}
                                isAddingSet={Boolean(addingSetByExerciseId[item.id])}
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