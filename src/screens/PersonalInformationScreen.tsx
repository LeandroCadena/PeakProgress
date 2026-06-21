import { Text, StyleSheet, ScrollView, Alert, TextInput, Pressable, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { useState } from "react";
import { updateUserEmail, updateUserPassword } from "../services/authService";

export default function PersonalInformationScreen() {
    const { user } = useAuth();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [editingSection, setEditingSection] = useState<
        "name" | "email" | "password" | null
    >(null);

    const {
        fullName,
        setFullName,
        saveProfile,
    } = useProfile();

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
            setEditingSection(null)
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
            setEditingSection(null)
            Alert.alert(
                "Verification required",
                "Check your new email address to confirm the change."
            );
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    async function handleSaveProfile() {
        await saveProfile()
        setEditingSection(null)
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Personal Information</Text>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Name</Text>
                        <Text style={styles.valueText}>
                            {fullName?.trim() || "Enter your name"}
                        </Text>
                    </View>

                    <Pressable onPress={() => setEditingSection("name")}>
                        <Text style={styles.editIcon}>✎</Text>
                    </Pressable>
                </View>

                {editingSection === "name" ? (
                    <>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your name"
                            placeholderTextColor="#6B7280"
                        />

                        <Pressable style={styles.button} onPress={handleSaveProfile}>
                            <Text style={styles.buttonText}>Save Name</Text>
                        </Pressable>

                        <Pressable
                            style={styles.secondaryButton}
                            onPress={() => setEditingSection(null)}
                        >
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </Pressable>
                    </>
                ) : null}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Email</Text>
                        <Text style={styles.valueText}>{user?.email}</Text>
                    </View>

                    <Pressable onPress={() => setEditingSection("email")}>
                        <Text style={styles.editIcon}>✎</Text>
                    </Pressable>
                </View>

                {editingSection === "email" ? (
                    <>
                        <TextInput
                            style={styles.input}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="Enter new email"
                            placeholderTextColor="#6B7280"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Pressable style={styles.button} onPress={handleChangeEmail}>
                            <Text style={styles.buttonText}>Update Email</Text>
                        </Pressable>

                        <Pressable
                            style={styles.secondaryButton}
                            onPress={() => setEditingSection(null)}
                        >
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </Pressable>
                    </>
                ) : null}
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>Password</Text>
                        <Text style={styles.valueText}>••••••••</Text>
                    </View>

                    <Pressable onPress={() => setEditingSection("password")}>
                        <Text style={styles.editIcon}>✎</Text>
                    </Pressable>
                </View>

                {editingSection === "password" ? (
                    <>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                        />

                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                        />

                        <Pressable style={styles.button} onPress={handleChangePassword}>
                            <Text style={styles.buttonText}>Update Password</Text>
                        </Pressable>

                        <Pressable
                            style={styles.secondaryButton}
                            onPress={() => setEditingSection(null)}
                        >
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </Pressable>
                    </>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 8,
        marginBottom: 24,
    },
    note: {
        color: "#9CA3AF",
        marginTop: 14,
        lineHeight: 20,
    },
    card: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 14,
        padding: 16,
        marginTop: 14,
    },

    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 6,
    },

    helperText: {
        color: "#9CA3AF",
        marginBottom: 14,
        lineHeight: 20,
    },

    label: {
        color: "#FFFFFF",
        fontWeight: "700",
        marginBottom: 8,
    },

    input: {
        backgroundColor: "#0B0F14",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: "#FFFFFF",
        marginBottom: 14,
    },

    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
    },

    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    valueText: {
        color: "#9CA3AF",
        marginTop: 6,
    },

    editIcon: {
        color: "#4CAF50",
        fontSize: 20,
        fontWeight: "800",
    },

    secondaryButton: {
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#30363D",
    },

    secondaryButtonText: {
        color: "#9CA3AF",
        fontWeight: "700",
        textAlign: "center",
    },
});