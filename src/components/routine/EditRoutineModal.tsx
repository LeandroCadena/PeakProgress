import { Modal, View, Text, TextInput, Pressable, StyleSheet } from "react-native";

type Props = {
    visible: boolean;
    name: string;
    description: string;
    onChangeName: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

export default function EditRoutineModal({
    visible,
    name,
    description,
    onChangeName,
    onChangeDescription,
    onSave,
    onCancel,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Edit Routine</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Routine name"
                        placeholderTextColor="#6B7280"
                        value={name}
                        onChangeText={onChangeName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Description"
                        placeholderTextColor="#6B7280"
                        value={description}
                        onChangeText={onChangeDescription}
                    />

                    <Pressable style={styles.button} onPress={onSave}>
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </Pressable>

                    <Pressable style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.buttonText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        padding: 24,
    },
    modalContent: {
        backgroundColor: "#161B22",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    modalTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 16,
    },
    input: {
        backgroundColor: "#0B0F14",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    cancelButton: {
        backgroundColor: "#374151",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 12,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});
