import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text, StyleSheet, ScrollView, Alert, View } from "react-native";

import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import IconButton from "../components/common/IconButton";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { updateUserEmail, updateUserPassword } from "../services/authService";
import { supabase } from "../services/supabase";
import { colors, spacing, typography } from "../theme";

export default function PersonalInformationScreen() {
    const { user } = useAuth();

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

            refreshUserEmail();
        }, [])
    );

    async function handleChangePassword() {
        if (!newPassword.trim()) {
            Alert.alert("Validation", "Password is required");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Validation", "Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Validation", "Passwords do not match");
            return;
        }

        try {
            await updateUserPassword(newPassword);
            setNewPassword("");
            setConfirmPassword("");
            setEditingSection(null);
            Alert.alert("Success", "Password updated successfully");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function handleChangeEmail() {
        const email = newEmail.trim();

        if (!email) {
            Alert.alert("Validation", "Email is required");
            return;
        }

        if (!email.includes("@")) {
            Alert.alert("Validation", "Please enter a valid email");
            return;
        }

        try {
            await updateUserEmail(email);
            setNewEmail("");
            setEditingSection(null);
            Alert.alert(
                "Verification required",
                "Check your new email address to confirm the change."
            );
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function handleSaveProfile() {
        await saveProfile();
        setEditingSection(null);
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Personal Information</Text>

            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Name</Text>
                        <Text style={styles.valueText}>
                            {fullName?.trim() || "Enter your name"}
                        </Text>
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
                            placeholder="Enter your name"
                            placeholderTextColor="#6B7280"
                        />

                        <AppButton
                            title="Save Name"
                            variant="success"
                            onPress={handleSaveProfile}
                        />

                        <AppButton
                            title="Cancel"
                            variant="secondary"
                            onPress={() => setEditingSection(null)}
                        />
                    </>
                ) : null}
            </Card>

            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Email</Text>
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
                            placeholder="Enter new email"
                            placeholderTextColor="#6B7280"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <AppButton
                            title="Update Email"
                            variant="success"
                            onPress={handleChangeEmail}
                        />

                        <AppButton
                            title="Cancel"
                            variant="secondary"
                            onPress={() => setEditingSection(null)}
                        />
                    </>
                ) : null}
            </Card>

            <Card style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Password</Text>
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
                            placeholder="Enter new password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                        />

                        <AppInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                        />

                        <AppButton
                            title="Update Password"
                            variant="success"
                            onPress={handleChangePassword}
                        />

                        <AppButton
                            title="Cancel"
                            variant="secondary"
                            onPress={() => setEditingSection(null)}
                        />
                    </>
                ) : null}
            </Card>
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
    content: {
        paddingBottom: spacing.xxl,
    },
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
    sectionTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
        marginBottom: spacing.xs,
    },
    valueText: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    input: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
});
