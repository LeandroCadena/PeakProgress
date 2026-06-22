import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";
import IconButton from "../common/IconButton";
import Card from "../common/Card";

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
        <Card>
            <View style={styles.header}>
                <View>
                    <Text style={styles.label}>Rest Timer</Text>
                    <Text style={styles.timer}>{timer}s</Text>
                </View>

                <IconButton
                    icon="↻"
                    variant="primary"
                    disabled={lastTimerDuration <= 0}
                    onPress={onRestart}
                />
            </View>

            {lastTimerDuration > 0 ? (
                <Text style={styles.lastTimerText}>
                    Last rest: {lastTimerDuration}s
                </Text>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
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
    lastTimerText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
});