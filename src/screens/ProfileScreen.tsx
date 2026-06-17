import {
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useProfile } from "../hooks/useProfile";
import ProfileForm from "../components/profile/ProfileForm";
import WeightLogCard from "../components/profile/WeightLogCard";
import WeightTrackingSection from "../components/profile/WeightTrackingSection";

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const {
        fullName,
        setFullName,
        goal,
        setGoal,
        experienceLevel,
        setExperienceLevel,
        heightCm,
        setHeightCm,
        weightKg,
        setWeightKg,
        newWeight,
        setNewWeight,
        weightLogs,
        saveProfile,
        addWeightLog,
        deleteWeightLog,
    } = useProfile();

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