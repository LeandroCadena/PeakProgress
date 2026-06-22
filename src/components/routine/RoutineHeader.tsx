import { View, Text, StyleSheet } from "react-native";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";
import IconButton from "../common/IconButton";
import {
    colors,
    spacing,
    typography,
} from "../../theme";

type Props = {
    title: string;
    description: string;
    isEditing: boolean;
    onChangeTitle: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onStartEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
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
    onDelete
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {isEditing ? (
                    <AppInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={onChangeTitle}
                        placeholder="Routine name"
                    />
                ) : (
                    <Text style={styles.title}>{title}</Text>
                )}

                {isEditing ? (
                    <View style={styles.actions}>
                        <IconButton
                            icon="✓"
                            variant="success"
                            onPress={onSave}
                        />
                        <IconButton
                            icon="✕"
                            onPress={onCancel}
                        />
                        <AppButton
                            title="Delete Routine"
                            variant="danger"
                            onPress={onDelete}
                        />
                    </View>
                ) : (
                    <IconButton
                        icon="✎"
                        variant="primary"
                        onPress={onStartEdit}
                    />
                )}
            </View>

            {isEditing ? (
                <AppInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={onChangeDescription}
                    placeholder="Description"
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
        marginBottom: spacing.lg,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },

    title: {
        flex: 1,
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
    },

    titleInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: "800",
    },

    description: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 20,
    },

    descriptionInput: {
        marginTop: spacing.md,
        minHeight: 72,
        textAlignVertical: "top",
    },

    actions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
});