import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
    fullName: string;
    onChangeFullName: (value: string) => void;
    onSave: () => void;
};

export default function ProfileForm({
    fullName,
    onChangeFullName,
    onSave,
}: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.helperText}>
                Enter your name so we can personalize your experience.
            </Text>

            <Text style={styles.label}>Name</Text>

            <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={onChangeFullName}
                placeholder="Enter your name"
                placeholderTextColor="#6B7280"
            />

            <Pressable style={styles.button} onPress={onSave}>
                <Text style={styles.buttonText}>Save Profile</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
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