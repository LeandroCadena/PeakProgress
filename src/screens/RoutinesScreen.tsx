import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

type Routine = {
    id: string;
    name: string;
    description: string | null;
};

export default function RoutinesScreen({ navigation }: any) {
    const { user } = useAuth();

    const [routines, setRoutines] = useState<Routine[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    async function fetchRoutines() {
        const { data, error } = await supabase
            .from("routines")
            .select("id, name, description")
            .order("created_at", { ascending: false });

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setRoutines(data ?? []);
    }

    async function createRoutine() {
        console.log("Create routine pressed");

        if (!user?.id) {
            Alert.alert("Auth error", "User is not logged in");
            return;
        }

        if (!name.trim()) {
            Alert.alert("Validation", "Routine name is required");
            return;
        }

        const { data, error } = await supabase
            .from("routines")
            .insert({
                user_id: user.id,
                name: name.trim(),
                description: description.trim() || null,
            })
            .select();

        console.log("Insert result:", { data, error });

        if (error) {
            Alert.alert("Error creating routine", error.message);
            return;
        }

        setName("");
        setDescription("");
        await fetchRoutines();

        Alert.alert("Success", "Routine created");
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Routines</Text>

            <TextInput
                style={styles.input}
                placeholder="Routine name"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
            />

            <Pressable style={styles.button} onPress={createRoutine}>
                <Text style={styles.buttonText}>Create Routine</Text>
            </Pressable>

            <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("RoutineDetail", {
                                routineId: item.id,
                                routineName: item.name,
                            })
                        }
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>

                        {item.description ? (
                            <Text style={styles.cardDescription}>{item.description}</Text>
                        ) : null}
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
    input: {
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 24,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
        textAlign: "center",
    },
    list: {
        gap: 12,
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
    cardDescription: {
        color: "#9CA3AF",
        marginTop: 6,
    },
});