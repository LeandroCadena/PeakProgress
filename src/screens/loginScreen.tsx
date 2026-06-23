import { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from "react-native";

import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }: any) {
    const { signIn } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        try {
            await signIn(email.trim(), password);
        } catch (error: any) {
            Alert.alert("Login error", error.message);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>PeakProgress</Text>
            <Text style={styles.subtitle}>Track your workouts. Build your progress.</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Pressable style={styles.button} onPress={handleLogin}>
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
    input: {
        width: "100%",
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        width: "100%",
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 18,
        marginTop: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
        textAlign: "center",
    },
    link: {
        color: "#4CAF50",
        fontSize: 15,
    },
});
