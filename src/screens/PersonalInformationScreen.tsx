import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import IconButton from "../components/common/IconButton";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useProfile } from "../hooks/useProfile";
import { useLanguage } from "../i18n/LanguageProvider";
import { updateUserEmail, updateUserPassword } from "../services/authService";
import { supabase } from "../services/supabase";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

export default function PersonalInformationScreen() {
    const { t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { session } = useAuth();
    const user = session?.user;
    const { showToast } = useToast();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentEmail, setCurrentEmail] = useState(user?.email ?? "");
    const [newEmail, setNewEmail] = useState("");
    const [editingSection, setEditingSection] = useState<"name" | "email" | "password" | null>(
        null
    );

    const { fullName, setFullName, saveProfile } = useProfile();

    useFocusEffect(
        useCallback(() => {
            async function refreshUserEmail() {
                const { data, error } = await supabase.auth.getUser();

                if (error) return;

                setCurrentEmail(data.user?.email ?? "");
            }

            if (user) void refreshUserEmail();
        }, [user])
    );

    async function handleChangePassword() {
        if (!newPassword.trim()) {
            showToast({
                type: "error",
                message: t("passwordRequired"),
            });
            return;
        }

        if (newPassword.length < 6) {
            showToast({
                type: "error",
                message: t("passwordTooShort"),
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast({
                type: "error",
                message: t("passwordMismatch"),
            });
            return;
        }

        try {
            await updateUserPassword(newPassword);
            setNewPassword("");
            setConfirmPassword("");
            setEditingSection(null);
            showToast({
                type: "success",
                message: t("passwordUpdated"),
            });
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("updatePasswordError"),
            });
        }
    }

    async function handleChangeEmail() {
        const email = newEmail.trim();

        if (!email) {
            showToast({
                type: "error",
                message: t("emailRequired"),
            });
            return;
        }

        if (!email.includes("@")) {
            showToast({
                type: "error",
                message: t("invalidEmail"),
            });
            return;
        }

        try {
            await updateUserEmail(email);
            setNewEmail("");
            setEditingSection(null);
            showToast({
                type: "success",
                message: t("confirmEmailChange"),
            });
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("updateEmailError"),
            });
        }
    }

    async function handleSaveProfile() {
        await saveProfile();
        setEditingSection(null);
    }

    return (
        <ScreenContainer scroll>
            <Text style={styles.title}>{t("personalInformation")}</Text>

            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={sharedStyles.screenTitle}>{t("name")}</Text>
                        <Text style={styles.valueText}>{fullName?.trim() || t("enterName")}</Text>
                    </View>

                    {editingSection !== "name" ? (
                        <IconButton
                            icon="✎"
                            variant="primary"
                            onPress={() => setEditingSection("name")}
                        />
                    ) : null}
                </View>

                {editingSection === "name" ? (
                    <>
                        <AppInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder={t("enterName")}
                        />

                        <AppButton
                            title={t("saveName")}
                            variant="success"
                            onPress={handleSaveProfile}
                        />

                        <AppButton
                            title={t("cancel")}
                            variant="secondary"
                            onPress={() => setEditingSection(null)}
                        />
                    </>
                ) : null}
            </Card>

            {session && (
                <>
                    <Card style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={sharedStyles.screenTitle}>{t("email")}</Text>
                                <Text style={styles.valueText}>{currentEmail}</Text>
                            </View>

                            {editingSection !== "email" ? (
                                <IconButton
                                    icon="✎"
                                    variant="primary"
                                    onPress={() => setEditingSection("email")}
                                />
                            ) : null}
                        </View>

                        {editingSection === "email" ? (
                            <>
                                <AppInput
                                    style={styles.input}
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    placeholder={t("enterNewEmail")}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <AppButton
                                    title={t("updateEmail")}
                                    variant="success"
                                    onPress={handleChangeEmail}
                                />

                                <AppButton
                                    title={t("cancel")}
                                    variant="secondary"
                                    onPress={() => setEditingSection(null)}
                                />
                            </>
                        ) : null}
                    </Card>

                    <Card style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={sharedStyles.screenTitle}>{t("password")}</Text>
                                <Text style={styles.valueText}>••••••••</Text>
                            </View>

                            {editingSection !== "password" ? (
                                <IconButton
                                    icon="✎"
                                    variant="primary"
                                    onPress={() => setEditingSection("password")}
                                />
                            ) : null}
                        </View>

                        {editingSection === "password" ? (
                            <>
                                <AppInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder={t("enterNewPassword")}
                                    secureTextEntry
                                />

                                <AppInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder={t("confirmNewPassword")}
                                    secureTextEntry
                                />

                                <AppButton
                                    title={t("updatePassword")}
                                    variant="success"
                                    onPress={handleChangePassword}
                                />

                                <AppButton
                                    title={t("cancel")}
                                    variant="secondary"
                                    onPress={() => setEditingSection(null)}
                                />
                            </>
                        ) : null}
                    </Card>
                </>
            )}
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
        marginBottom: spacing.lg,
    },
    card: {
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    valueText: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    input: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
}));
