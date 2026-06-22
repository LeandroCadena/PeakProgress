import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, componentStyles } from "../../theme";
import { sanitizeIntegerInput } from "../../utils/numberInput";
import AppInput from "../common/AppInput";

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

            <AppInput
                style={styles.input}
                value={String(value ?? 0)}
                disabled={!editable}
                keyboardType="numeric"
                textAlign="center"
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
        width: 70,
    },
    unit: {
        color: colors.textSecondary,
        fontSize: typography.caption,
    },
});