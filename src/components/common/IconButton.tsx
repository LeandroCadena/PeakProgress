import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, componentStyles, typography } from "../../theme";

type Variant = "primary" | "secondary" | "danger" | "success";

type Props = {
    icon: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: Variant;
    style?: ViewStyle | ViewStyle[];
};

export default function IconButton({
    icon,
    onPress,
    disabled = false,
    variant = "secondary",
    style,
}: Props) {
    return (
        <Pressable
            style={[styles.button, styles[variant], disabled && styles.disabled, style]}
            disabled={disabled}
            onPress={onPress}
        >
            <Text style={styles.icon}>{icon}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: componentStyles.iconButtonSize,
        height: componentStyles.iconButtonSize,
        borderRadius: componentStyles.buttonRadius,
        alignItems: "center",
        justifyContent: "center",
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.inputBorder,
    },
    danger: {
        backgroundColor: colors.danger,
    },
    success: {
        backgroundColor: colors.success,
    },
    disabled: {
        opacity: 0.5,
    },
    icon: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: "800",
    },
});
