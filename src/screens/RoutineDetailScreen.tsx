import { StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useRoutineDetail } from "../hooks/useRoutineDetail";
import RoutineDetailLayout from "../components/routine/RoutineDetailLayout";
import RoutineExerciseSection from "../components/routine/RoutineExerciseSection";
import RoutineHeader from "../components/routine/RoutineHeader";
import ActiveWorkoutModal from "../components/workout/ActiveWorkoutModal";
import AppButton from "../components/common/AppButton";
import { spacing } from "../theme";

type RouteParams = {
    RoutineDetail: {
        routineId: string;
        routineName: string;
        routineDescription: string;
    };
};

export default function RoutineDetailScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "RoutineDetail">>();
    const { routineId, routineName, routineDescription } = route.params;

    const {
        routineTitle,
        routineExercises,
        editRoutineDescription,
        deleteRoutineExercise,
        saveRoutineChanges,
        startWorkout,
        isStartingWorkout,
        isEditingRoutine,
        draftRoutineName,
        draftRoutineDescription,
        setDraftRoutineName,
        setDraftRoutineDescription,
        startEditingRoutine,
        cancelEditingRoutine,
        moveRoutineExercise,
        deleteRoutine,
        routineExerciseSets,
        updateTemplateSet,
        addTemplateSet,
        deleteTemplateSet,
        updateLocalTemplateSetValue,
        activeWorkoutModalVisible,
        activeWorkoutRoutineName,
        activeWorkoutElapsedText,
        resumeActiveWorkout,
        discardAndStartWorkout,
        setActiveWorkoutModalVisible,
        updateSetRest,
        updateExerciseRest,
    } = useRoutineDetail({
        routineId,
        routineName,
        routineDescription,
        navigation,
    });

    return (
        <RoutineDetailLayout>
            <RoutineHeader
                title={isEditingRoutine ? draftRoutineName : routineTitle}
                description={isEditingRoutine ? draftRoutineDescription : editRoutineDescription}
                isEditing={isEditingRoutine}
                onChangeTitle={setDraftRoutineName}
                onChangeDescription={setDraftRoutineDescription}
                onStartEdit={startEditingRoutine}
                onSave={saveRoutineChanges}
                onCancel={cancelEditingRoutine}
                onDelete={deleteRoutine}
            />

            <AppButton
                title={
                    isEditingRoutine
                        ? "Save Changes First"
                        : isStartingWorkout
                            ? "Starting..."
                            : "Start Workout"
                }
                variant="primary"
                disabled={isEditingRoutine || isStartingWorkout}
                onPress={startWorkout}
                style={styles.actionButton}
            />

            <RoutineExerciseSection
                routineExercises={routineExercises}
                routineExerciseSets={routineExerciseSets}
                isEditing={isEditingRoutine}
                onDelete={deleteRoutineExercise}
                onMoveUp={(index) => moveRoutineExercise(index, "up")}
                onMoveDown={(index) => moveRoutineExercise(index, "down")}
                onUpdateSet={updateTemplateSet}
                onAddSet={addTemplateSet}
                onDeleteSet={deleteTemplateSet}
                updateLocalTemplateSetValue={updateLocalTemplateSetValue}
                onUpdateSetRest={updateSetRest}
                onUpdateExerciseRest={updateExerciseRest}
            />

            {isEditingRoutine ? (
                <AppButton
                    title="+ Add Exercise"
                    variant="success"
                    onPress={() =>
                        navigation.navigate("ExercisePicker", {
                            mode: "routine",
                            routineId,
                            currentCount:
                                routineExercises.length > 0
                                    ? Math.max(
                                        ...routineExercises.map(
                                            (item) => item.position ?? 0
                                        )
                                    ) + 1
                                    : 0,
                            currentExerciseIds: routineExercises.map(
                                (item) => item.exercise_id
                            ),
                        })
                    }
                    style={styles.actionButton}
                />
            ) : null
            }

            <ActiveWorkoutModal
                visible={activeWorkoutModalVisible}
                routineName={activeWorkoutRoutineName}
                elapsedText={activeWorkoutElapsedText}
                onResume={resumeActiveWorkout}
                onDiscardAndStart={discardAndStartWorkout}
                onCancel={() => setActiveWorkoutModalVisible(false)}
                isStarting={isStartingWorkout}
            />
        </RoutineDetailLayout >
    );
}

const styles = StyleSheet.create({
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 20,
    },
    actionButton: {
        marginTop: spacing.md,
    },
});