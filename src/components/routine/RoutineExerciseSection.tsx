import { Text, StyleSheet, View } from "react-native";
import type { ReactElement } from "react";
import DraggableFlatList, {
    RenderItemParams,
} from "react-native-draggable-flatlist";

import { sharedStyles, spacing } from "../../theme";
import { RoutineExercise, RoutineExerciseSet } from "../../types/routine";
import EmptyStateCard from "../common/EmptyStateCard";
import RestTimeEditor from "../workout/RestTimeEditor";

import RoutineExerciseCard from "./RoutineExerciseCard";

type Props = {
    routineExercises: RoutineExercise[];
    isEditing: boolean;
    header?: ReactElement;
    footer?: ReactElement | null;
    onDelete: (routineExerciseId: string) => void;
    onReorder: (exercises: RoutineExercise[]) => void;
    routineExerciseSets: Record<string, RoutineExerciseSet[]>;
    onUpdateSet: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
    onAddSet: (routineExerciseId: string) => void;
    onDeleteSet: (
        routineExerciseId: string,
        setId: string
    ) => void;
    onUpdateSetRest: (
        routineExerciseId: string,
        value: number
    ) => void;
    onUpdateExerciseRest: (
        routineExerciseId: string,
        value: number
    ) => void;
    updateLocalTemplateSetValue: (
        setId: string,
        field: "weight" | "reps",
        value: string
    ) => void;
};

export default function RoutineExerciseSection({
    routineExercises,
    isEditing,
    header,
    footer,
    onDelete,
    onReorder,
    routineExerciseSets,
    onUpdateSet,
    onAddSet,
    onDeleteSet,
    updateLocalTemplateSetValue,
    onUpdateSetRest,
    onUpdateExerciseRest,
}: Props) {
    function renderExercise({
        item,
        drag,
        isActive,
        getIndex,
    }: RenderItemParams<RoutineExercise>) {
        const index = getIndex() ?? 0;

        return (
            <View style={[styles.item, isActive && styles.activeItem]}>
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
                    onDrag={drag}
                    isDragging={isActive}
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
        );
    }

    return (
        <DraggableFlatList
            data={routineExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExercise}
            onDragEnd={({ data }) => {
                if (isEditing) {
                    onReorder(data);
                }
            }}
            activationDistance={16}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            ListHeaderComponent={
                <>
                    {header}

                    <Text style={sharedStyles.sectionTitle}>
                        Current exercises
                    </Text>

                    {routineExercises.length === 0 ? (
                        <EmptyStateCard
                            title="No exercises added yet"
                            message="Add your first exercise now."
                        />
                    ) : null}
                </>
            }
            ListFooterComponent={
                footer ? (
                    <View style={styles.footer}>
                        {footer}
                    </View>
                ) : null
            }
        />
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: 48,
        paddingBottom: 120,
    },
    item: {
        marginBottom: spacing.md,
    },
    activeItem: {
        opacity: 0.96,
        elevation: 6,
    },
    footer: {
        marginTop: spacing.sm,
    },
});