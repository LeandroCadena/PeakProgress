import { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    Pressable,
    StyleSheet,
    Alert,
    Linking,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { getExerciseDetail } from "../services/exerciseService";

type RouteParams = {
    ExerciseDetail: {
        exerciseId: string;
    };
};

export default function ExerciseDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, "ExerciseDetail">>();
    const { exerciseId } = route.params;

    const [exercise, setExercise] = useState<any>(null);

    async function fetchExerciseDetail() {
        try {
            const data = await getExerciseDetail(exerciseId);
            setExercise(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    useEffect(() => {
        fetchExerciseDetail();
    }, [exerciseId]);

    if (!exercise) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading exercise...</Text>
            </View>
        );
    }

    const muscles =
        exercise.exercise_muscles
            ?.map((item: any) => item.muscles?.name)
            .filter(Boolean)
            .join(", ") ?? "No muscles listed";

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {exercise.image_url ? (
                <Image source={{ uri: exercise.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No image available</Text>
                </View>
            )}

            <Text style={styles.title}>{exercise.name}</Text>

            <Text style={styles.meta}>
                {exercise.equipment ?? "No equipment"} ·{" "}
                {exercise.difficulty ?? "No difficulty"}
            </Text>

            <Text style={styles.sectionTitle}>Muscles</Text>
            <Text style={styles.text}>{muscles}</Text>

            {exercise.description ? (
                <>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.text}>{exercise.description}</Text>
                </>
            ) : null}

            {exercise.instructions ? (
                <>
                    <Text style={styles.sectionTitle}>Instructions</Text>
                    <Text style={styles.text}>{exercise.instructions}</Text>
                </>
            ) : null}

            {exercise.tips ? (
                <>
                    <Text style={styles.sectionTitle}>Tips</Text>
                    <Text style={styles.text}>{exercise.tips}</Text>
                </>
            ) : null}

            {exercise.video_url ? (
                <Pressable
                    style={styles.videoButton}
                    onPress={() => Linking.openURL(exercise.video_url)}
                >
                    <Text style={styles.videoButtonText}>Watch Video</Text>
                </Pressable>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
    },
    content: {
        padding: 24,
        paddingTop: 64,
        paddingBottom: 40,
    },
    loadingText: {
        color: "#9CA3AF",
        marginTop: 80,
        textAlign: "center",
    },
    image: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        marginBottom: 20,
    },
    imagePlaceholder: {
        height: 220,
        borderRadius: 16,
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    placeholderText: {
        color: "#9CA3AF",
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    meta: {
        color: "#9CA3AF",
        marginTop: 8,
        marginBottom: 20,
    },
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 8,
    },
    text: {
        color: "#D1D5DB",
        lineHeight: 22,
    },
    videoButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 28,
    },
    videoButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
});