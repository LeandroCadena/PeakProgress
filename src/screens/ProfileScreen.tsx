import { Text, Pressable } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../i18n/LanguageProvider";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

export default function ProfileScreen({ navigation }: any) {
    const { t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { showToast } = useToast();
    const { session, signOut } = useAuth();

    return (
        <ScreenContainer>
            <Text style={styles.title}>{t("profile")}</Text>

            <Card style={styles.profileCard}>
                <Text style={sharedStyles.screenSubtitle}>
                    {t(session ? "athlete" : "guestMode")}
                </Text>
                <Text style={styles.profileSubtitle}>
                    {t(session ? "profileDescription" : "guestDescription")}
                </Text>
            </Card>

            <Text style={sharedStyles.screenTitle}>{t("account")}</Text>
            {!session && (
                <Card style={styles.menuItem}>
                    <Pressable
                        style={styles.menuContent}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.menuTitle}>{t("login")}</Text>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                </Card>
            )}

            <Card style={styles.menuItem}>
                <Pressable
                    style={styles.menuContent}
                    onPress={() => navigation.navigate("PersonalInformation")}
                >
                    <Text style={styles.menuTitle}>{t("personalInformation")}</Text>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Text style={styles.menuSubtitle}>{t("manageAccount")}</Text>
            </Card>

            <Card style={styles.menuItem}>
                <Pressable
                    style={styles.menuContent}
                    onPress={() => navigation.navigate("History")}
                >
                    <Text style={styles.menuTitle}>{t("history")}</Text>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Text style={styles.menuSubtitle}>{t("completedWorkouts")}</Text>
            </Card>

            <Card style={styles.menuItem}>
                <Pressable
                    style={styles.menuContent}
                    onPress={() => navigation.navigate("Settings")}
                >
                    <Text style={styles.menuTitle}>{t("settings")}</Text>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Text style={styles.menuSubtitle}>{t("appPreferences")}</Text>
            </Card>

            {session && (
                <AppButton
                    title={t("logout")}
                    variant="danger"
                    onPress={() =>
                        signOut().catch(() =>
                            showToast({ type: "error", message: t("logoutError") })
                        )
                    }
                    style={styles.logoutButton}
                />
            )}
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
        marginBottom: spacing.xl,
    },
    profileCard: {
        marginBottom: spacing.lg,
    },
    profileSubtitle: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    menuItem: {
        marginBottom: spacing.md,
    },
    menuContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    menuTitle: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: typography.weightBold,
    },
    menuSubtitle: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    chevron: {
        color: colors.textSecondary,
        fontSize: 24,
        fontWeight: typography.weightBold,
    },
    logoutButton: {
        marginTop: spacing.lg,
    },
}));
