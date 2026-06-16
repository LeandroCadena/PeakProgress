import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen({ navigation }: any) {
    const { user, signOut } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to PeakProgress</Text>

            <Text style={styles.subtitle}>Logged in as {user?.email}</Text>

            <Pressable
                style={styles.button}
                onPress={() => navigation.navigate("Routines")}
            >
                <Text style={styles.buttonText}>My Routines</Text>
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={signOut}>
                <Text style={styles.buttonText}>Logout</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        color: "#9CA3AF",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 24,
    },
    button: {
        width: "100%",
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    logoutButton: {
        width: "100%",
        backgroundColor: "#EF4444",
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
        textAlign: "center",
    },
});