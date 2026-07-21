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
        <View style={styles.header}>
            <View>
                <Text style={styles.timer}>{timer}s</Text>
            </View>

            <Pressable style={styles.restartButton} onPress={onRestart}>
                <Ionicons
                    name="reload-outline"
                    size={28}
                    color={colors.text}
                />
            </Pressable>
        </View>
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
        marginLeft: 20,
    },
    lastTimerText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    restartButton: {
        width: 50,
        height: 40,
        borderRadius: 22,
        borderWidth: 1,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 20,
    },
});
