import { View, Text, Pressable, StyleSheet } from "react-native";

export default function LoginScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>PeakProgress</Text>
            <Text style={styles.subtitle}>Track your workouts. Build your progress.</Text>

            <Pressable style={styles.button} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Create account</Text>
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
        fontSize: 36,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        color: "#9CA3AF",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 32,
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        marginBottom: 18,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
    link: {
        color: "#4CAF50",
        fontSize: 15,
    },
});