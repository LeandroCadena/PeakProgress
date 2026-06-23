import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme";

type Props = {
    visible: boolean;
    routineName: string;
    elapsedText?: string;
    onResume: () => void;
    onDiscardAndStart: () => void;
    onCancel: () => void;
    isStarting: boolean;
};

export default function ActiveWorkoutModal({
    visible,
    routineName,
    elapsedText,
    onResume,
    onDiscardAndStart,
    onCancel,
    isStarting,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Workout already running</Text>

                    <Text style={styles.text}>You already have an active workout.</Text>

                    <Text style={styles.routineName}>{routineName}</Text>

                    {elapsedText ? <Text style={styles.elapsed}>{elapsedText}</Text> : null}

                    <Pressable style={styles.primaryButton} onPress={onResume}>
                        <Text style={styles.primaryText}>Resume Workout</Text>
                    </Pressable>

                    <Pressable
                        style={styles.dangerButton}
                        onPress={onDiscardAndStart}
                        disabled={isStarting}
                    >
                        <Text style={styles.dangerText}>
                            {isStarting ? "Starting..." : "Discard and Start New"}
                        </Text>
                    </Pressable>

                    <Pressable style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        padding: spacing.xl,
    },
    modal: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: 18,
        padding: spacing.xl,
    },
    title: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
    },
    text: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginTop: spacing.lg,
    },
    dangerButton: {
        backgroundColor: colors.danger,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginTop: spacing.sm,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: colors.cardBorder,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginTop: spacing.sm,
    },
    buttonText: {
        color: colors.text,
        fontWeight: "700",
        textAlign: "center",
    },
    secondaryButtonText: {
        color: colors.textSecondary,
        fontWeight: "700",
        textAlign: "center",
    },
    content: {
        width: "100%",
        backgroundColor: "#161B22",
        borderRadius: 18,
        padding: 22,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    routineName: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 4,
    },
    elapsed: {
        color: "#4CAF50",
        fontWeight: "700",
        marginBottom: 18,
    },
    primaryText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
    dangerText: {
        color: "#EF4444",
        fontWeight: "800",
    },
    cancelButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 6,
    },
    cancelText: {
        color: "#9CA3AF",
        fontWeight: "700",
    },
});
