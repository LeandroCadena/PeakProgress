import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";

import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { colors, componentStyles, typography } from "../theme";

export default function RegisterScreen({ navigation }: any) {
    const { signUp } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleRegister() {
        try {
            await signUp(email.trim(), password);
            Alert.alert("Account created", "Please check your email to confirm your account.");
            navigation.navigate("Login");
        } catch (error: any) {
            Alert.alert("Register error", error.message);
        }
    }

    return (
        <ScreenContainer>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.title}>Create account</Text>
                    <Text style={styles.subtitle}>Start tracking your gym progress today.</Text>

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

                    <AppButton title="Register" onPress={handleRegister} />

                    <Pressable onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.link}>Already have an account?</Text>
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
        padding: componentStyles.cardPadding,
        borderRadius: componentStyles.cardRadius,
        gap: 16,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "700",
        textAlign: "center",
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.body,
        textAlign: "center",
        marginBottom: 8,
    },
    link: {
        color: colors.primary,
        fontSize: typography.caption,
        textAlign: "center",
        marginTop: 8,
    },
});
