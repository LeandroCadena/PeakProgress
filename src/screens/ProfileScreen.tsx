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
import { useAuth } from "../context/AuthContext";
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
    getProfile,
    upsertProfile,
    getWeightLogs,
    createWeightLog,
    removeWeightLog,
} from "../services/profileService";

type WeightLog = {
    id: string;
    weight_kg: number;
    logged_at: string;
};

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const [fullName, setFullName] = useState("");
    const [goal, setGoal] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [newWeight, setNewWeight] = useState("");
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            fetchWeightLogs();
        }, [user?.id])
    );

    async function fetchProfile() {
        if (!user?.id) return;

        try {
            const data = await getProfile(user.id);

            if (!data) return;

            setFullName(data.full_name ?? "");
            setGoal(data.goal ?? "");
            setExperienceLevel(data.experience_level ?? "");
            setHeightCm(data.height_cm ? String(data.height_cm) : "");
            setWeightKg(data.weight_kg ? String(data.weight_kg) : "");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function saveProfile() {
        if (!user?.id) return;

        try {
            await upsertProfile({
                userId: user.id,
                fullName,
                goal,
                experienceLevel,
                heightCm,
                weightKg,
            });

            Alert.alert("Saved", "Profile updated successfully.");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function fetchWeightLogs() {
        try {
            const data = await getWeightLogs();
            setWeightLogs(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function addWeightLog() {
        if (!user?.id) return;

        if (!newWeight.trim()) {
            Alert.alert("Validation", "Weight is required");
            return;
        }

        try {
            await createWeightLog({
                userId: user.id,
                weightKg: Number(newWeight),
            });

            setNewWeight("");
            await fetchWeightLogs();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function deleteWeightLog(id: string) {
        try {
            await removeWeightLog(id);
            await fetchWeightLogs();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

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

            <Text style={styles.sectionTitle}>Weight Tracking</Text>

            {weightLogs.length > 0 ? (
                <LineChart
                    data={{
                        labels: weightLogs
                            .slice()
                            .reverse()
                            .map((_, index) => `${index + 1}`),
                        datasets: [
                            {
                                data: weightLogs
                                    .slice()
                                    .reverse()
                                    .map((log) => Number(log.weight_kg)),
                            },
                        ],
                    }}
                    width={Dimensions.get("window").width - 48}
                    height={220}
                    yAxisSuffix="kg"
                    chartConfig={{
                        backgroundColor: "#161B22",
                        backgroundGradientFrom: "#161B22",
                        backgroundGradientTo: "#161B22",
                        decimalPlaces: 1,
                        color: () => "#4CAF50",
                        labelColor: () => "#9CA3AF",
                    }}
                    bezier
                    style={styles.chart}
                />
            ) : null}

            <TextInput
                style={styles.input}
                placeholder="New weight kg"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={newWeight}
                onChangeText={setNewWeight}
            />

            <Pressable style={styles.button} onPress={addWeightLog}>
                <Text style={styles.buttonText}>Add Weight Log</Text>
            </Pressable>

            {weightLogs.map((log) => (
                <View key={log.id} style={styles.weightLogCard}>
                    <View>
                        <Text style={styles.weightValue}>{log.weight_kg} kg</Text>
                        <Text style={styles.weightDate}>
                            {new Date(log.logged_at).toLocaleDateString()}
                        </Text>
                    </View>

                    <Pressable
                        style={styles.deleteButton}
                        onPress={() => deleteWeightLog(log.id)}
                    >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                </View>
            ))}

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
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        marginTop: 28,
        marginBottom: 14,
    },
    weightLogCard: {
        backgroundColor: "#161B22",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    weightValue: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },
    weightDate: {
        color: "#9CA3AF",
        marginTop: 4,
    },
    deleteButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    chart: {
        borderRadius: 16,
        marginBottom: 16,
    },
});