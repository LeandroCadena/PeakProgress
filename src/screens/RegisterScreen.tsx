import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { componentStyles, typography, useAppTheme, createThemedStyles } from "../theme";

export default function RegisterScreen({ navigation }: any) {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const { signUp } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleRegister() {
        try {
            await signUp(email.trim(), password);
            showToast({
                type: "success",
                message: t("accountCreated"),
            });
            navigation.navigate("Login");
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("registerError"),
            });
        }
    }

    return (
        <ScreenContainer>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.title}>{t("createAccount")}</Text>
                    <Text style={styles.subtitle}>{t("registerDescription")}</Text>

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

                    <AppButton title={t("register")} onPress={handleRegister} />

                    <Pressable onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.link}>{t("alreadyRegistered")}</Text>
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
        padding: componentStyles.cardPadding,
        borderRadius: componentStyles.cardRadius,
        gap: 16,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightBold,
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
}));
