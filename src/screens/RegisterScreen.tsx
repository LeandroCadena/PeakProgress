import { View, Text, Pressable, StyleSheet } from "react-native";

export default function RegisterScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start tracking your gym progress today.</Text>

            <Pressable style={styles.button} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.buttonText}>Register</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>Already have an account?</Text>
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
        fontSize: 32,
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