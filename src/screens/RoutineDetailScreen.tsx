import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { StyleSheet } from "react-native";

import AppButton from "../components/common/AppButton";
import ScreenContainer from "../components/common/ScreenContainer";
import RoutineExerciseSection from "../components/routine/RoutineExerciseSection";
import RoutineHeader from "../components/routine/RoutineHeader";
import ActiveWorkoutModal from "../components/workout/ActiveWorkoutModal";
import { useRoutineDetail } from "../hooks/useRoutineDetail";
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
        <ScreenContainer scroll>
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

            {!isEditingRoutine ? (
                <AppButton
                    title={isStartingWorkout ? "Starting..." : "Start Workout"}
                    disabled={isStartingWorkout}
                    onPress={startWorkout}
                    style={styles.actionButton}
                    iconLeft={<Ionicons name="barbell-outline" size={22} color="#FFFFFF" />}
                    showChevron
                />
            ) : null}

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
                                          ...routineExercises.map((item) => item.position ?? 0)
                                      ) + 1
                                    : 0,
                            currentExerciseIds: routineExercises.map((item) => item.exercise_id),
                        })
                    }
                />
            ) : null}

            <ActiveWorkoutModal
                visible={activeWorkoutModalVisible}
                routineName={activeWorkoutRoutineName}
                elapsedText={activeWorkoutElapsedText}
                onResume={resumeActiveWorkout}
                onDiscardAndStart={discardAndStartWorkout}
                onCancel={() => setActiveWorkoutModalVisible(false)}
                isStarting={isStartingWorkout}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        marginBottom: spacing.lg,
    },
});
