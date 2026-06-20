import {
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <Pressable
                style={styles.menuItem}
                onPress={() => navigation.navigate("PersonalInformation")}
            >
                <Text style={styles.menuTitle}>Personal Information</Text>
                <Text style={styles.menuSubtitle}>
                    Manage your profile and account
                </Text>
            </Pressable>

            <Pressable
                style={styles.menuItem}
                onPress={() => navigation.navigate("History")}
            >
                <Text style={styles.menuTitle}>History</Text>
                <Text style={styles.menuSubtitle}>View your completed workouts</Text>
            </Pressable>

            <Pressable
                style={styles.menuItem}
                onPress={() => navigation.navigate("Settings")}
            >
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>App preferences and timers</Text>
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
    menuItem: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
    },
    menuTitle: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    menuSubtitle: {
        color: "#9CA3AF",
        marginTop: 4,
    },
    emailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        marginBottom: 24,
    },

    editIcon: {
        color: "#4CAF50",
        fontSize: 16,
        fontWeight: "800",
    },
});