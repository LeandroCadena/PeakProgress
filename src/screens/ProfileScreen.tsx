import { Text, StyleSheet, Pressable, ScrollView } from "react-native";

import AppButton from "../components/common/AppButton";
import Card from "../components/common/Card";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme";

export default function ProfileScreen({ navigation }: any) {
    const { signOut } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <Card style={styles.menuItem}>
                <Pressable onPress={() => navigation.navigate("PersonalInformation")}>
                    <Text style={styles.menuTitle}>Personal Information</Text>
                    <Text style={styles.menuSubtitle}>Manage your profile and account</Text>
                </Pressable>
            </Card>

            <Card style={styles.menuItem}>
                <Pressable onPress={() => navigation.navigate("History")}>
                    <Text style={styles.menuTitle}>History</Text>
                    <Text style={styles.menuSubtitle}>View your completed workouts</Text>
                </Pressable>
            </Card>

            <Card style={styles.menuItem}>
                <Pressable onPress={() => navigation.navigate("Settings")}>
                    <Text style={styles.menuTitle}>Settings</Text>
                    <Text style={styles.menuSubtitle}>App preferences and timers</Text>
                </Pressable>
            </Card>

            <AppButton
                title="Logout"
                variant="danger"
                onPress={signOut}
                style={styles.logoutButton}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xxl,
        paddingTop: 64,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
        marginBottom: spacing.xl,
    },
    menuItem: {
        marginBottom: spacing.md,
    },
    menuTitle: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: "800",
    },
    menuSubtitle: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    logoutButton: {
        marginTop: spacing.md,
        marginBottom: 40,
    },
});
