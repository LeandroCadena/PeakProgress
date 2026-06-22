import {
    Text,
    StyleSheet,
    Pressable,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useRoutineDetail } from "../hooks/useRoutineDetail";
import RoutineDetailLayout from "../components/routine/RoutineDetailLayout";
import RoutineExerciseSection from "../components/routine/RoutineExerciseSection";
import RoutineHeader from "../components/routine/RoutineHeader";
import ActiveWorkoutModal from "../components/workout/ActiveWorkoutModal";

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

            <Pressable
                style={[
                    styles.startButton,
                    (isEditingRoutine || isStartingWorkout) &&
                    styles.startButtonDisabled,
                ]}
                disabled={isEditingRoutine || isStartingWorkout}
                onPress={startWorkout}
            >
                <Text
                    style={[
                        styles.startButtonText,
                        (isEditingRoutine || isStartingWorkout) &&
                        styles.startButtonTextDisabled,
                    ]}
                >
                    {isEditingRoutine
                        ? "Save Changes First"
                        : isStartingWorkout
                            ? "Starting..."
                            : "Start Workout"}
                </Text>
            </Pressable>

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
                <Pressable
                    style={styles.addExerciseButton}
                    onPress={() =>
                        navigation.navigate("ExercisePicker", {
                            mode: "routine",
                            routineId,
                            currentCount: routineExercises.length > 0
                                ? Math.max(...routineExercises.map((item) => item.position ?? 0)) + 1
                                : 0,
                            currentExerciseIds: routineExercises.map((item) => item.exercise_id),
                        })
                    }
                >
                    <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
                </Pressable>
            ) : null
            }

            <ActiveWorkoutModal
                visible={activeWorkoutModalVisible}
                routineName={activeWorkoutRoutineName}
                elapsedText={activeWorkoutElapsedText}
                onResume={resumeActiveWorkout}
                onDiscardAndStart={discardAndStartWorkout}
                onCancel={() => setActiveWorkoutModalVisible(false)}
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
    startButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    startButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },
    addExerciseButton: {
        backgroundColor: "#102A1A",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        marginTop: 12,
    },
    addExerciseButtonText: {
        color: "#4CAF50",
        fontWeight: "800",
    },
    startButtonDisabled: {
        backgroundColor: "#374151",
        opacity: 0.7,
    },

    startButtonTextDisabled: {
        color: "#9CA3AF",
    },
});