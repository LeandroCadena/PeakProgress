import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, componentStyles, sharedStyles, spacing } from "../../theme";

import AppButton from "./AppButton";

type Props = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "primary" | "danger";
    errorMessage?: string | null;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
};

export default function AppDialog({
    visible,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    errorMessage = null,
    onConfirm,
    onCancel,
}: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false);

    async function handleConfirm() {
        if (processingRef.current) return;

        processingRef.current = true;
        setIsProcessing(true);

        try {
            await onConfirm();
        } catch (error) {
            console.error("Dialog confirmation failed:", error);
        } finally {
            processingRef.current = false;
            setIsProcessing(false);
        }
    }

    function handleCancel() {
        if (!processingRef.current) {
            onCancel();
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={handleCancel}
                    accessibilityLabel="Close dialog"
                />

                <View style={styles.content}>
                    <Text style={sharedStyles.screenTitle}>{title}</Text>

                    <Text style={styles.message}>{message}</Text>

                    {errorMessage ? (
                        <Text style={styles.errorMessage}>{errorMessage}</Text>
                    ) : null}

                    <View style={styles.actions}>
                        <AppButton
                            title={cancelLabel}
                            variant="secondary"
                            onPress={handleCancel}
                            disabled={isProcessing}
                            style={styles.actionButton}
                        />

                        <AppButton
                            title={confirmLabel}
                            variant={variant}
                            onPress={handleConfirm}
                            disabled={isProcessing}
                            style={styles.actionButton}
                        />
                    </View>
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
    content: {
        width: "100%",
        backgroundColor: colors.card,
        borderRadius: componentStyles.cardRadius,
        padding: spacing.xl,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
    },
    message: {
        color: colors.textSecondary,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    errorMessage: {
        color: colors.danger,
        marginBottom: spacing.md,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
    },
});