import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../i18n/LanguageProvider";
import { isGoogleSignInAvailable } from "../services/googleSignIn";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

export default function LoginScreen({ navigation }: any) {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const { signIn, signInWithGoogle, resendConfirmation, confirmEmailCode } = useAuth();
    const { showToast } = useToast();

    const googlePending = useRef(false);
    const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
    const [showEmail, setShowEmail] = useState(!isGoogleSignInAvailable);

    async function handleGoogleLogin() {
        if (googlePending.current) return;
        googlePending.current = true;
        setIsSigningInWithGoogle(true);
        try {
            await signInWithGoogle();
        } catch {
            showToast({ type: "error", message: t("googleLoginError") });
        } finally {
            googlePending.current = false;
            setIsSigningInWithGoogle(false);
        }
    }

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showCode, setShowCode] = useState(false);
    const [code, setCode] = useState("");

    async function handleConfirmCode() {
        if (!email.trim() || !code.trim()) {
            showToast({ type: "error", message: t("confirmationCodeRequired") });
            return;
        }
        try {
            await confirmEmailCode(email.trim(), code.trim());
        } catch {
            showToast({ type: "error", message: t("emailConfirmationError") });
        }
    }

    async function handleResend() {
        if (!email.trim()) {
            showToast({ type: "error", message: t("emailRequired") });
            return;
        }
        try {
            await resendConfirmation(email.trim());
            setShowCode(true);
            showToast({ type: "success", message: t("confirmationResent") });
        } catch {
            showToast({ type: "error", message: t("resendConfirmationError") });
        }
    }

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
                    <Text style={styles.title}>Gym Time</Text>
                    <Text style={styles.subtitle}>{t("guestAccountConfirmation")}</Text>

                    {isGoogleSignInAvailable && (
                        <>
                            <AppButton
                                title={t(isSigningInWithGoogle ? "loading" : "continueWithGoogle")}
                                disabled={isSigningInWithGoogle}
                                onPress={handleGoogleLogin}
                            />
                            <AppButton
                                title={t(showEmail ? "hideEmailLogin" : "continueWithEmail")}
                                variant="secondary"
                                disabled={isSigningInWithGoogle}
                                onPress={() => setShowEmail((visible) => !visible)}
                            />
                        </>
                    )}

                    {showEmail && (
                        <View
                            style={styles.card}
                            pointerEvents={isSigningInWithGoogle ? "none" : "auto"}
                        >
                            <AppInput
                                placeholder={t("email")}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />

                            {showCode ? (
                                <>
                                    <AppInput
                                        placeholder={t("confirmationCode")}
                                        keyboardType="number-pad"
                                        value={code}
                                        onChangeText={setCode}
                                    />
                                    <AppButton
                                        title={t("confirmEmail")}
                                        onPress={handleConfirmCode}
                                    />
                                </>
                            ) : (
                                <>
                                    <AppInput
                                        placeholder={t("password")}
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <AppButton title={t("login")} onPress={handleLogin} />
                                </>
                            )}

                            <Pressable onPress={() => setShowCode(!showCode)}>
                                <Text style={styles.link}>
                                    {t(showCode ? "login" : "useConfirmationCode")}
                                </Text>
                            </Pressable>
                            <Pressable onPress={handleResend}>
                                <Text style={styles.link}>{t("resendConfirmation")}</Text>
                            </Pressable>
                            <Pressable onPress={() => navigation.navigate("Register")}>
                                <Text style={styles.link}>{t("createAccount")}</Text>
                            </Pressable>
                        </View>
                    )}

                    <AppButton
                        title={t("continueWithoutAccount")}
                        variant="secondary"
                        disabled={isSigningInWithGoogle}
                        onPress={() => navigation.goBack()}
                    />
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
