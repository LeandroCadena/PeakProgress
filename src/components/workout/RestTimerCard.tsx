import { View, Text, Pressable, StyleSheet } from "react-native";

type RestTimerCardProps = {
    timer: number;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
};

export default function RestTimerCard({
    timer,
    onStart,
    onPause,
    onReset,
}: RestTimerCardProps) {
    return (
        <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Rest Timer</Text>
            <Text style={styles.timerText}>{timer}s</Text>

            <View style={styles.timerActions}>
                <Pressable style={styles.timerButton} onPress={onStart}>
                    <Text style={styles.buttonText}>Start</Text>
                </Pressable>

                <Pressable style={styles.timerButton} onPress={onPause}>
                    <Text style={styles.buttonText}>Pause</Text>
                </Pressable>

                <Pressable style={styles.timerButton} onPress={onReset}>
                    <Text style={styles.buttonText}>Reset</Text>
                </Pressable>
            </View>
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
});