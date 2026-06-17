import {
    Text,
    StyleSheet,
    Pressable,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useRoutineDetail } from "../hooks/useRoutineDetail";
import RoutineDetailLayout from "../components/routine/RoutineDetailLayout";
import EditRoutineExerciseModal from "../components/routine/EditRoutineExerciseModal";
import AvailableExerciseSection from "../components/routine/AvailableExerciseSection";
import RoutineExerciseSection from "../components/routine/RoutineExerciseSection";
import RoutineHeader from "../components/routine/RoutineHeader";

type RouteParams = {
    RoutineDetail: {
        routineId: string;
        routineName: string;
    };
};

export default function RoutineDetailScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "RoutineDetail">>();
    const { routineId, routineName } = route.params;

    const {
        routineTitle,
        availableExercises,
        routineExercises,
        editingExercise,
        setEditingExercise,
        editSets,
        editReps,
        editWeight,
        editRestSeconds,
        setEditSets,
        setEditReps,
        setEditWeight,
        setEditRestSeconds,
        editRoutineDescription,
        addExerciseToRoutine,
        openEditModal,
        saveEditedExercise,
        deleteRoutineExercise,
        saveRoutineChanges,
        startWorkout,
        isEditingRoutine,
        draftRoutineName,
        draftRoutineDescription,
        setDraftRoutineName,
        setDraftRoutineDescription,
        startEditingRoutine,
        cancelEditingRoutine,
    } = useRoutineDetail({
        routineId,
        routineName,
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
            />

            <Pressable style={styles.startButton} onPress={startWorkout}>
                <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>

            <RoutineExerciseSection
                routineExercises={routineExercises}
                onEdit={openEditModal}
                onDelete={deleteRoutineExercise}
            />

            <AvailableExerciseSection
                exercises={availableExercises}
                onAddExercise={addExerciseToRoutine}
            />

            <EditRoutineExerciseModal
                visible={!!editingExercise}
                sets={editSets}
                reps={editReps}
                weight={editWeight}
                restSeconds={editRestSeconds}
                onChangeSets={setEditSets}
                onChangeReps={setEditReps}
                onChangeWeight={setEditWeight}
                onChangeRestSeconds={setEditRestSeconds}
                onSave={saveEditedExercise}
                onCancel={() => setEditingExercise(null)}
            />
        </RoutineDetailLayout>
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
});