import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, spacing, typography, componentStyles } from "../../theme";
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
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    label: {
        color: colors.textSecondary,
        fontWeight: "700",
        flex: 1,
    },
    input: {
        backgroundColor: colors.inputBackground,
        color: colors.text,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
        borderRadius: 10,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md - 2,
        width: 70,
        textAlign: "center",
    },
    disabledInput: {
        opacity: 0.6,
    },
    unit: {
        color: colors.textSecondary,
        fontSize: typography.caption,
    },
});