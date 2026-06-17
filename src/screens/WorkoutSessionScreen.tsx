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
        routineExercises,
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
    } = useWorkoutSession({
        sessionId,
        routineId,
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
                data={routineExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <WorkoutExerciseCard
                        exercise={item}
                        savedSets={savedSets[item.exercise_id] ?? []}
                        getSetInputValue={getSetInputValue}
                        updateLocalSetValue={updateLocalSetValue}
                        updateSetValue={updateSetValue}
                        toggleSetCompleted={toggleSetCompleted}
                        deleteSet={deleteSet}
                        addEmptySet={addEmptySet}
                    />
                )}
            />

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
});