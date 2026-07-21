import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, componentStyles, spacing, typography } from "../../theme";

type Variant = "primary" | "success" | "danger" | "secondary";

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: Variant;
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
    iconLeft?: any;
    showChevron?: boolean;
    fullWidth?: boolean;
};

export default function AppButton({
    title,
    onPress,
    disabled = false,
    variant = "primary",
    style,
    iconLeft,
    showChevron,
    fullWidth,
}: Props) {
    return (
        <Pressable
            style={[styles.button, styles[variant], disabled && styles.disabled, style]}
            disabled={disabled}
            onPress={onPress}
        >
            <View style={styles.content}>
                {iconLeft ? <View style={styles.sideSlot}>{iconLeft}</View> : null}

                <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>
                    {title}
                </Text>

                {showChevron ? (
                    <View style={styles.sideSlot}>
                        <Ionicons name="chevron-forward" size={22} color={colors.text} />
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.sm,
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
    secondaryText: {
        color: colors.textSecondary,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
    },
    sideSlot: {
        flex: 1,
        width: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        flex: 4,
        color: colors.text,
        fontWeight: typography.weightSemiBold,
        fontSize: typography.subtitle,
        textAlign: "center",
    },
});
