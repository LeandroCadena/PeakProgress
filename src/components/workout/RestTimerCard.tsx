import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

type Props = {
    timer: number;
    lastTimerDuration: number;
    onRestart: () => void;
};

export default function RestTimerCard({
    timer,
    lastTimerDuration,
    onRestart,
}: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.label}>Rest Timer</Text>
                    <Text style={styles.timer}>{timer}s</Text>
                </View>

                <Pressable
                    style={[
                        styles.restartButton,
                        lastTimerDuration <= 0 && styles.restartButtonDisabled,
                    ]}
                    disabled={lastTimerDuration <= 0}
                    onPress={onRestart}
                >
                    <Text style={styles.restartIcon}>↻</Text>
                </Pressable>
            </View>

            {lastTimerDuration > 0 ? (
                <Text style={styles.lastTimerText}>
                    Last rest: {lastTimerDuration}s
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: 14,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    label: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        marginBottom: spacing.xs,
    },
    timer: {
        color: colors.text,
        fontSize: 36,
        fontWeight: "800",
    },
    restartButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    restartButtonDisabled: {
        backgroundColor: colors.inputBorder,
        opacity: 0.6,
    },
    restartIcon: {
        color: colors.text,
        fontSize: 24,
        fontWeight: "800",
    },
    lastTimerText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
});