import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, componentStyles, spacing } from "../../theme";

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
};

export default function AppButton({
    title,
    onPress,
    disabled = false,
    variant = "primary",
    style,
    iconLeft,
    showChevron,
}: Props) {
    return (
        <Pressable
            style={[styles.button, styles[variant], disabled && styles.disabled, style]}
            disabled={disabled}
            onPress={onPress}
        >
            <View style={styles.content}>
                {iconLeft ? <View style={styles.iconSlot}>{iconLeft}</View> : null}

                <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>
                    {title}
                </Text>

                {showChevron ? (
                    <View style={styles.chevron}>
                        <Ionicons name="chevron-forward" size={22} color={colors.text} />
                    </View>
                ) : null}
            </View>
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
    content: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
    },
    chevronSpacer: {
        width: 22,
    },
    iconSlot: {
        position: "absolute",
        left: spacing.xl,
    },
    chevron: {
        position: "absolute",
        right: spacing.xl,
    },
});
