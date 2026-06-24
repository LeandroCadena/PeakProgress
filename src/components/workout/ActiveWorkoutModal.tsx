import { Modal, StyleSheet, Text, View } from "react-native";

import { sharedStyles, spacing } from "../../theme";
import AppButton from "../common/AppButton";

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
                    <Text style={sharedStyles.screenTitle}>Workout already running</Text>

                    <Text style={sharedStyles.screenSubtitle}>
                        You already have an active workout.
                    </Text>

                    <Text style={styles.routineName}>{routineName}</Text>

                    {elapsedText ? <Text style={styles.elapsed}>{elapsedText}</Text> : null}

                    <AppButton
                        style={styles.appButton}
                        title={"Resume Workout"}
                        onPress={onResume}
                    />

                    <AppButton
                        style={styles.appButton}
                        variant="danger"
                        title={isStarting ? "Starting..." : "Discard and Start New"}
                        onPress={onDiscardAndStart}
                        disabled={isStarting}
                    />

                    <AppButton
                        style={styles.appButton}
                        variant="secondary"
                        title={"Cancel"}
                        onPress={onCancel}
                        disabled={isStarting}
                    />
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
    appButton: {
        marginTop: spacing.md,
    },
});
