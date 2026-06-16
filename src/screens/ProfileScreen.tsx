import { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const [fullName, setFullName] = useState("");
    const [goal, setGoal] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");

    async function fetchProfile() {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from("profiles")
            .select("full_name, goal, experience_level, height_cm, weight_kg")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        if (!data) return;

        setFullName(data.full_name ?? "");
        setGoal(data.goal ?? "");
        setExperienceLevel(data.experience_level ?? "");
        setHeightCm(data.height_cm ? String(data.height_cm) : "");
        setWeightKg(data.weight_kg ? String(data.weight_kg) : "");
    }

    async function saveProfile() {
        if (!user?.id) return;

        const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            full_name: fullName.trim() || null,
            goal: goal.trim() || null,
            experience_level: experienceLevel.trim() || null,
            height_cm: heightCm ? Number(heightCm) : null,
            weight_kg: weightKg ? Number(weightKg) : null,
        });

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        Alert.alert("Saved", "Profile updated successfully.");
    }

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [user?.id])
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>

            <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#6B7280"
                value={fullName}
                onChangeText={setFullName}
            />

            <TextInput
                style={styles.input}
                placeholder="Goal - e.g. Gain muscle"
                placeholderTextColor="#6B7280"
                value={goal}
                onChangeText={setGoal}
            />

            <TextInput
                style={styles.input}
                placeholder="Experience - Beginner / Intermediate / Advanced"
                placeholderTextColor="#6B7280"
                value={experienceLevel}
                onChangeText={setExperienceLevel}
            />

            <TextInput
                style={styles.input}
                placeholder="Height cm"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={heightCm}
                onChangeText={setHeightCm}
            />

            <TextInput
                style={styles.input}
                placeholder="Weight kg"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={weightKg}
                onChangeText={setWeightKg}
            />

            <Pressable style={styles.button} onPress={saveProfile}>
                <Text style={styles.buttonText}>Save Profile</Text>
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={signOut}>
                <Text style={styles.buttonText}>Logout</Text>
            </Pressable>
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
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 8,
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
        marginTop: 8,
    },
    logoutButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 12,
        marginBottom: 40,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});