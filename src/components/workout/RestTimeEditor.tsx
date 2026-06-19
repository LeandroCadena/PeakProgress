import { View, Text, TextInput, StyleSheet } from "react-native";
import { sanitizeIntegerInput } from "../../utils/numberInput";

type Props = {
    label: string;
    value: number;
    editable: boolean;
    onChange: (value: number) => void;
};

export default function RestTimeEditor({
    label,
    value,
    editable,
    onChange,
}: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                style={[styles.input, !editable && styles.disabledInput]}
                value={String(value ?? 0)}
                editable={editable}
                keyboardType="numeric"
                onChangeText={(text) => {
                    const sanitized = sanitizeIntegerInput(text);
                    onChange(Number(sanitized || 0));
                }}
            />

            <Text style={styles.unit}>sec</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 10,
        marginBottom: 10,
    },
    label: {
        color: "#9CA3AF",
        fontWeight: "700",
        flex: 1,
    },
    input: {
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        width: 70,
        textAlign: "center",
    },
    disabledInput: {
        opacity: 0.6,
    },
    unit: {
        color: "#9CA3AF",
    },
});