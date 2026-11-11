import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

export default function LoginScreen({ navigation }: any) {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const { signIn } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        try {
            await signIn(email.trim(), password);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("loginError"),
            });
        }
    }

    return (
        <ScreenContainer>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.title}>PeakProgress</Text>
                    <Text style={styles.subtitle}>{t("loginDescription")}</Text>

                    <AppInput
                        placeholder={t("email")}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <AppInput
                        placeholder={t("password")}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <AppButton title={t("login")} onPress={handleLogin} />

                    <Pressable onPress={() => navigation.navigate("Register")}>
                        <Text style={styles.link}>{t("createAccount")}</Text>
                    </Pressable>
                </Card>
            </View>
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
}));
