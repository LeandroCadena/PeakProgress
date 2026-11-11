import { Text, Pressable } from "react-native";

import { useLanguage } from "../i18n/LanguageProvider";
import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { spacing, typography, useAppTheme, createThemedStyles } from "../theme";

export default function ProfileScreen({ navigation }: any) {
    const { t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { signOut } = useAuth();

    return (
        <ScreenContainer>
            <Text style={styles.title}>{t("profile")}</Text>

            <Card style={styles.profileCard}>
                <Text style={sharedStyles.screenSubtitle}>{t("athlete")}</Text>
                <Text style={styles.profileSubtitle}>{t("profileDescription")}</Text>
            </Card>

            <Text style={sharedStyles.screenTitle}>{t("account")}</Text>

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

            <AppButton
                title={t("logout")}
                variant="danger"
                onPress={signOut}
                style={styles.logoutButton}
            />
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
