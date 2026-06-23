import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, componentStyles, spacing } from "../../theme";

type Variant = "primary" | "success" | "danger" | "secondary";

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: Variant;
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
};

export default function AppButton({
    title,
    onPress,
    disabled = false,
    variant = "primary",
    style,
}: Props) {
    return (
        <Pressable
            style={[styles.button, styles[variant], disabled && styles.disabled, style]}
            disabled={disabled}
            onPress={onPress}
        >
            <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>
                {title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.lg,
        borderRadius: componentStyles.buttonRadius,
        alignItems: "center",
        justifyContent: "center",
    },
    primary: {
        backgroundColor: colors.primary,
    },
    success: {
        backgroundColor: colors.successDark,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.success,
    },
    danger: {
        backgroundColor: colors.danger,
    },
    secondary: {
        backgroundColor: "transparent",
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: colors.text,
        fontWeight: "800",
        textAlign: "center",
    },
    secondaryText: {
        color: colors.textSecondary,
    },
});
