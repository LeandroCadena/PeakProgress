import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    title: string;
    description: string;
    isEditing: boolean;
    onChangeTitle: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onStartEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
};

export default function RoutineHeader({
    title,
    description,
    isEditing,
    onChangeTitle,
    onChangeDescription,
    onStartEdit,
    onSave,
    onCancel,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {isEditing ? (
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={onChangeTitle}
                        placeholder="Routine name"
                        placeholderTextColor="#6B7280"
                    />
                ) : (
                    <Text style={styles.title}>{title}</Text>
                )}

                {isEditing ? (
                    <View style={styles.actions}>
                        <Pressable style={styles.iconButton} onPress={onSave}>
                            <Ionicons name="checkmark-outline" size={22} color="#FFFFFF" />
                        </Pressable>

                        <Pressable style={styles.cancelButton} onPress={onCancel}>
                            <Ionicons name="close-outline" size={22} color="#FFFFFF" />
                        </Pressable>
                    </View>
                ) : (
                    <Pressable style={styles.iconButton} onPress={onStartEdit}>
                        <Ionicons name="create-outline" size={22} color="#FFFFFF" />
                    </Pressable>
                )}
            </View>

            {isEditing ? (
                <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={onChangeDescription}
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    multiline
                />
            ) : description ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 18,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    title: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    titleInput: {
        flex: 1,
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
        fontSize: 24,
        fontWeight: "800",
    },
    description: {
        color: "#9CA3AF",
        marginTop: 8,
        lineHeight: 20,
    },
    descriptionInput: {
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
        marginTop: 12,
        minHeight: 72,
        textAlignVertical: "top",
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        backgroundColor: "#2563EB",
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: "#374151",
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
});