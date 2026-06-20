import { Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import ProfileForm from "../components/profile/ProfileForm";

export default function PersonalInformationScreen() {
    const { user } = useAuth();

    const {
        fullName,
        setFullName,
        saveProfile,
    } = useProfile();

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>

            <ProfileForm
                fullName={fullName}
                onChangeFullName={setFullName}
                onSave={saveProfile}
            />

            <Text style={styles.note}>
                Email and password changes will be available soon.
            </Text>
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
});