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
import { WeightLog } from "../types/profile";
import ProfileForm from "../components/profile/ProfileForm";
import WeightLogCard from "../components/profile/WeightLogCard";
import WeightTrackingSection from "../components/profile/WeightTrackingSection";

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

            <ProfileForm
                fullName={fullName}
                goal={goal}
                experienceLevel={experienceLevel}
                heightCm={heightCm}
                weightKg={weightKg}
                onChangeFullName={setFullName}
                onChangeGoal={setGoal}
                onChangeExperienceLevel={setExperienceLevel}
                onChangeHeightCm={setHeightCm}
                onChangeWeightKg={setWeightKg}
                onSave={saveProfile}
            />

            <WeightTrackingSection
                newWeight={newWeight}
                onChangeWeight={setNewWeight}
                onAddWeight={addWeightLog}
                weightLogs={weightLogs}
                onDeleteWeight={deleteWeightLog}
            />

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

            {weightLogs.map((log) => (
                <WeightLogCard
                    key={log.id}
                    log={log}
                    onDelete={() => deleteWeightLog(log.id)}
                />
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
    chart: {
        borderRadius: 16,
        marginBottom: 16,
    },
});