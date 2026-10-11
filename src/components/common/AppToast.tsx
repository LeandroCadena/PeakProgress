import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../theme";

export type AppToastType = "success" | "error" | "warning" | "info";

type Props = {
    visible: boolean;
    message: string;
    type?: AppToastType;
    duration?: number;
    onDismiss: () => void;
};

const toastConfig = {
    success: {
        icon: "checkmark-circle-outline",
        color: "#22C55E",
    },
    error: {
        icon: "alert-circle-outline",
        color: "#EF4444",
    },
    warning: {
        icon: "warning-outline",
        color: "#F59E0B",
    },
    info: {
        icon: "information-circle-outline",
        color: colors.primary,
    },
} as const;

export default function AppToast({
    visible,
    message,
    type = "info",
    duration = 4000,
    onDismiss,
}: Props) {
    useEffect(() => {
        if (!visible || duration <= 0) return;

        const timeout = setTimeout(onDismiss, duration);

        return () => clearTimeout(timeout);
    }, [visible, message, type, duration, onDismiss]);

    if (!visible) return null;

    const config = toastConfig[type];

    return (
        <View
            style={styles.container}
            pointerEvents="box-none"
        >
            <View
                style={[
                    styles.toast,
                    { borderLeftColor: config.color },
                ]}
                accessibilityRole="alert"
            >
                <Ionicons
                    name={config.icon}
                    size={22}
                    color={config.color}
                />

                <Text style={styles.message}>
                    {message}
                </Text>

                <Pressable
                    onPress={onDismiss}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss notification"
                    hitSlop={10}
                >
                    <Ionicons
                        name="close"
                        size={20}
                        color={colors.textSecondary}
                    />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 16,
        left: spacing.lg,
        right: spacing.lg,
        zIndex: 100,
        elevation: 100,
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderRadius: 12,
    },
    message: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        lineHeight: 20,
    },
});