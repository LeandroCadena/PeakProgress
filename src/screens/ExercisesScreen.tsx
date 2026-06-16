import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Pressable
} from "react-native";
import { supabase } from "../services/supabase";

type Exercise = {
    id: string;
    name: string;
    equipment: string | null;
    difficulty: string | null;
};

export default function ExercisesScreen({ navigation }: any) {
    const [exercises, setExercises] = useState<Exercise[]>([]);

    async function fetchExercises() {
        const { data, error } = await supabase
            .from("exercises")
            .select("id, name, equipment, difficulty")
            .order("name", { ascending: true });

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setExercises(data ?? []);
    }

    useEffect(() => {
        fetchExercises();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Exercises</Text>

            <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("ExerciseDetail", {
                                exerciseId: item.id,
                                exerciseName: item.name,
                            })
                        }
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardText}>
                            {item.equipment ?? "No equipment"} · {item.difficulty ?? "No difficulty"}
                        </Text>
                    </Pressable>
                )}
            />
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
        marginBottom: 24,
    },
    list: {
        gap: 12,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
});