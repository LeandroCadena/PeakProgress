import { View, Text, StyleSheet } from "react-native";

import { colors, spacing, typography } from "../../theme";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import IconButton from "../common/IconButton";

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
    onDelete,
}: Props) {
    return (
        <View style={styles.container}>
            {isEditing ? (
                <AppInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={onChangeTitle}
                    placeholder="Routine name"
                />
            ) : (
                <View style={styles.row}>
                    <Text style={styles.title}>{title}</Text>
                    <IconButton icon="✎" variant="primary" onPress={onStartEdit} />
                </View>
            )}

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

            {isEditing ? (
                <>
                    <View style={styles.editActions}>
                        <AppButton title="Save Changes" variant="success" onPress={onSave} />
                        <AppButton title="Cancel" variant="secondary" onPress={onCancel} />
                    </View>

                    <AppButton
                        title="Delete Routine"
                        variant="danger"
                        onPress={onDelete}
                        style={styles.deleteButton}
                    />
                </>
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
        gap: spacing.sm,
    },
    title: {
        flex: 1,
        color: colors.text,
        fontSize: typography.title,
        fontWeight: "800",
    },
    titleInput: {
        flex: 1,
        fontSize: typography.title,
        fontWeight: typography.weightExtraBold,
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
    editActions: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    deleteButton: {
        marginTop: spacing.sm,
    },
});
