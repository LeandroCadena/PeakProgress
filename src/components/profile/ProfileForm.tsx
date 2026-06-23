import { StyleSheet, Text } from "react-native";

import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import Card from "../common/Card";

type Props = {
    fullName: string;
    onChangeFullName: (value: string) => void;
    onSave: () => void;
};

export default function ProfileForm({ fullName, onChangeFullName, onSave }: Props) {
    return (
        <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.helperText}>
                Enter your name so we can personalize your experience.
            </Text>

            <Text style={styles.label}>Name</Text>

            <AppInput
                value={fullName}
                onChangeText={onChangeFullName}
                placeholder="Enter your name"
            />

            <AppButton title="Save Profile" variant="success" onPress={onSave} />
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
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
});
