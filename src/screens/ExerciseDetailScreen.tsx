import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { supabase } from "../services/supabase";

type RouteParams = {
    ExerciseDetail: {
        exerciseId: string;
        exerciseName: string;
    };
};

type ExerciseDetail = {
    id: string;
    name: string;
    description: string | null;
    instructions: string | null;
    equipment: string | null;
    difficulty: string | null;
    exercise_muscles: {
        role: string;
        muscles: {
            name: string;
        }[];
    }[];
};

export default function ExerciseDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, "ExerciseDetail">>();
    const { exerciseId, exerciseName } = route.params;

    const [exercise, setExercise] = useState<ExerciseDetail | null>(null);

    async function fetchExerciseDetail() {
        const { data, error } = await supabase
            .from("exercises")
            .select(`
        id,
        name,
        description,
        instructions,
        equipment,
        difficulty,
        exercise_muscles (
          role,
          muscles (
            name
          )
        )
      `)
            .eq("id", exerciseId)
            .single();

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setExercise(data as ExerciseDetail);
    }

    useEffect(() => {
        fetchExerciseDetail();
    }, []);

    const primaryMuscles =
        exercise?.exercise_muscles
            ?.filter((item) => item.role === "primary")
            .map((item) => item.muscles?.[0]?.name)
            .filter(Boolean) ?? [];

    const secondaryMuscles =
        exercise?.exercise_muscles
            ?.filter((item) => item.role === "secondary")
            .map((item) => item.muscles?.[0]?.name)
            .filter(Boolean) ?? [];

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{exercise?.name ?? exerciseName}</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Equipment</Text>
                <Text style={styles.value}>{exercise?.equipment ?? "N/A"}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Difficulty</Text>
                <Text style={styles.value}>{exercise?.difficulty ?? "N/A"}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Primary muscles</Text>
                <Text style={styles.value}>
                    {primaryMuscles.length ? primaryMuscles.join(", ") : "N/A"}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Secondary muscles</Text>
                <Text style={styles.value}>
                    {secondaryMuscles.length ? secondaryMuscles.join(", ") : "N/A"}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Instructions</Text>
                <Text style={styles.value}>
                    {exercise?.instructions ?? "Instructions will be added soon."}
                </Text>
            </View>
        </ScrollView>
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
        marginBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
        marginBottom: 12,
    },
    label: {
        color: "#9CA3AF",
        fontSize: 13,
        marginBottom: 6,
    },
    value: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});