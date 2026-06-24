import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { colors, spacing, typography } from "../../theme";
import Card from "../common/Card";

type Props = {
    timer: number;
    lastTimerDuration: number;
    onRestart: () => void;
};

export default function RestTimerCard({ timer, lastTimerDuration, onRestart }: Props) {
    return (
        <Card>
            <View style={styles.header}>
                <View>
                    <Text style={styles.label}>Rest Timer</Text>
                    <Text style={styles.timer}>{timer}s</Text>
                    {lastTimerDuration > 0 ? (
                        <Text style={styles.lastTimerText}>Last rest: {lastTimerDuration}s</Text>
                    ) : null}
                </View>

                <Pressable style={styles.restartButton} onPress={onRestart}>
                    <Ionicons
                        name="reload-outline"
                        size={32}
                        color={colors.text}
                        style={styles.restartIcon}
                    />
                </Pressable>
            </View>
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
        fontWeight: typography.weightExtraBold,
    },
    lastTimerText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    restartButton: {
        width: 60,
        height: 50,
        borderRadius: 22,
        borderWidth: 1,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    restartIcon: {
        marginTop: 1,
    },
});
