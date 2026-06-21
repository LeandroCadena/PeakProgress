import { Text, StyleSheet, ScrollView, Alert, TextInput, Pressable, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import ProfileForm from "../components/profile/ProfileForm";
import { useState } from "react";
import { updateUserPassword } from "../services/authService";

export default function PersonalInformationScreen() {
    const { user } = useAuth();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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
            Alert.alert("Success", "Password updated successfully");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>

            <ProfileForm
                fullName={fullName}
                onChangeFullName={setFullName}
                onSave={saveProfile}
            />

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <Text style={styles.helperText}>
                    Update your account password.
                </Text>

                <Text style={styles.label}>New Password</Text>
                <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                />

                <Text style={styles.label}>Confirm Password</Text>
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
});