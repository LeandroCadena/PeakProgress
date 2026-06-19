import { View, Text, Pressable, StyleSheet } from "react-native";

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
    timerCard: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
        marginBottom: 16,
    },
    timerLabel: {
        color: "#9CA3AF",
        fontSize: 14,
    },
    timerText: {
        color: "#FFFFFF",
        fontSize: 36,
        fontWeight: "800",
        marginTop: 4,
        marginBottom: 12,
    },
    timerActions: {
        flexDirection: "row",
        gap: 8,
    },
    timerButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        paddingVertical: 10,
        borderRadius: 10,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
    card: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    label: {
        color: "#9CA3AF",
        fontSize: 14,
        marginBottom: 8,
    },

    timer: {
        color: "#FFFFFF",
        fontSize: 36,
        fontWeight: "800",
    },

    restartButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
    },

    restartButtonDisabled: {
        backgroundColor: "#374151",
        opacity: 0.6,
    },

    restartIcon: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "800",
    },

    lastTimerText: {
        color: "#9CA3AF",
        marginTop: 10,
    },
});