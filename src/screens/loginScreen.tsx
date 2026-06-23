import { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Alert } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { colors, componentStyles, spacing, typography } from "../theme";
import AppInput from "../components/common/AppInput";

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
        <ScreenContainer>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.title}>PeakProgress</Text>
                    <Text style={styles.subtitle}>Track your workouts. Build your progress.</Text>

                    <AppInput
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <AppInput
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <AppButton title="Login" onPress={handleLogin} />

                    <Pressable onPress={() => navigation.navigate("Register")}>
                        <Text style={styles.link}>Create account</Text>
                    </Pressable>
                </Card>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: "center",
    },
    card: {
        gap: spacing.md,
    },
    title: {
        color: colors.text,
        fontSize: 36,
        fontWeight: "800",
        textAlign: "center",
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        textAlign: "center",
        marginBottom: spacing.md,
    },
    link: {
        color: colors.primary,
        fontSize: typography.caption,
        textAlign: "center",
        marginTop: spacing.sm,
    },
});
