import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { WorkoutSessionRouteParams } from "../types/workout";
import RestTimerCard from "../components/workout/RestTimerCard";
import WorkoutExerciseCard from "../components/workout/WorkoutExerciseCard";
import { useWorkoutSession } from "../hooks/useWorkoutSession";

export default function WorkoutSessionScreen({ navigation }: any) {
    const route = useRoute<RouteProp<WorkoutSessionRouteParams, "WorkoutSession">>();
    const { sessionId, routineId, routineName } = route.params;

    const {
        sessionExercises,
        savedSets,
        timer,
        startTimer,
        pauseTimer,
        resetTimer,
        addEmptySet,
        updateSetValue,
        toggleSetCompleted,
        deleteSet,
        finishWorkout,
        getSetInputValue,
        updateLocalSetValue,
        deleteSessionExercise,
    } = useWorkoutSession({
        sessionId,
        routineId,
        routineName,
        onFinish: () =>
            navigation.navigate("WorkoutSummary", {
                sessionId,
                routineName,
            }),
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routineName}</Text>
            <Text style={styles.subtitle}>Workout Session</Text>

            <RestTimerCard
                timer={timer}
                onStart={() => startTimer()}
                onPause={pauseTimer}
                onReset={resetTimer}
            />

            <FlatList
                data={sessionExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <WorkoutExerciseCard
                        exercise={item}
                        savedSets={savedSets[item.id] ?? []}
                        getSetInputValue={getSetInputValue}
                        updateLocalSetValue={updateLocalSetValue}
                        updateSetValue={updateSetValue}
                        toggleSetCompleted={toggleSetCompleted}
                        deleteSet={deleteSet}
                        addEmptySet={addEmptySet}
                        onDeleteExercise={() => deleteSessionExercise(item.id)}
                    />
                )}
            />

            <Pressable
                style={styles.addExerciseButton}
                onPress={() =>
                    navigation.navigate("ExercisePicker", {
                        mode: "session",
                        sessionId,
                        currentCount: sessionExercises.length,
                        currentExerciseIds: sessionExercises.map((item) => item.exercise_id),
                    })
                }
            >
                <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
            </Pressable>

            <Pressable style={styles.finishButton} onPress={finishWorkout}>
                <Text style={styles.buttonText}>Finish Workout</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 20,
    },
    list: {
        gap: 14,
        paddingBottom: 24,
    },
    finishButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
    addExerciseButton: {
        backgroundColor: "#102A1A",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#4CAF50",
        alignItems: "center",
        marginBottom: 12,
    },
    addExerciseButtonText: {
        color: "#4CAF50",
        fontWeight: "800",
    },
});