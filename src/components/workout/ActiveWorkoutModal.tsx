import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    visible: boolean;
    routineName: string;
    elapsedText?: string;
    onResume: () => void;
    onDiscardAndStart: () => void;
    onCancel: () => void;
};

export default function ActiveWorkoutModal({
    visible,
    routineName,
    elapsedText,
    onResume,
    onDiscardAndStart,
    onCancel,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Workout already running</Text>

                    <Text style={styles.text}>
                        You already have an active workout.
                    </Text>

                    <Text style={styles.routineName}>{routineName}</Text>

                    {elapsedText ? (
                        <Text style={styles.elapsed}>{elapsedText}</Text>
                    ) : null}

                    <Pressable style={styles.primaryButton} onPress={onResume}>
                        <Text style={styles.primaryText}>Resume Workout</Text>
                    </Pressable>

                    <Pressable style={styles.dangerButton} onPress={onDiscardAndStart}>
                        <Text style={styles.dangerText}>Discard and Start New</Text>
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
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    content: {
        width: "100%",
        backgroundColor: "#161B22",
        borderRadius: 18,
        padding: 22,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    title: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 10,
    },
    text: {
        color: "#9CA3AF",
        marginBottom: 12,
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
    primaryButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
    },
    primaryText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
    dangerButton: {
        backgroundColor: "#2A1111",
        borderWidth: 1,
        borderColor: "#EF4444",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
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