import { Text, StyleSheet, Pressable } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import SectionTitle from "../components/common/SectionTitle";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme";

export default function ProfileScreen({ navigation }: any) {
    const { signOut } = useAuth();

    return (
        <ScreenContainer>
            <Text style={styles.title}>Profile</Text>

            <Card style={styles.profileCard}>
                <Text style={styles.profileName}>Athlete</Text>
                <Text style={styles.profileSubtitle}>
                    Track your workouts and stay consistent.
                </Text>
            </Card>

            <SectionTitle>Account</SectionTitle>

            <Card style={styles.menuItem}>
                <Pressable
                    style={styles.menuContent}
                    onPress={() => navigation.navigate("PersonalInformation")}
                >
                    <Text style={styles.menuTitle}>Personal Information</Text>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Text style={styles.menuSubtitle}>
                    Manage your profile and account
                </Text>
            </Card>

            <Card style={styles.menuItem}>
                <Pressable
                    style={styles.menuContent}
                    onPress={() => navigation.navigate("History")}
                >
                    <Text style={styles.menuTitle}>History</Text>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Text style={styles.menuSubtitle}>
                    View your completed workouts
                </Text>
            </Card>

            <Card style={styles.menuItem}>
                <Pressable
                    style={styles.menuContent}
                    onPress={() => navigation.navigate("Settings")}
                >
                    <Text style={styles.menuTitle}>Settings</Text>
                    <Text style={styles.chevron}>›</Text>
                </Pressable>

                <Text style={styles.menuSubtitle}>
                    App preferences and timers
                </Text>
            </Card>

            <AppButton
                title="Logout"
                variant="danger"
                onPress={signOut}
                style={styles.logoutButton}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
        marginBottom: spacing.xl,
    },
    profileCard: {
        marginBottom: spacing.lg,
    },
    profileName: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: typography.weightExtraBold,
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
});
