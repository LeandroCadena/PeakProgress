import { View, Text, StyleSheet } from "react-native";

import { sharedStyles, spacing } from "../../theme";
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
                <View style={styles.row}>
                    <AppInput
                        style={sharedStyles.screenTitle}
                        value={title}
                        onChangeText={onChangeTitle}
                        placeholder="Routine name"
                    />
                    <IconButton icon="✎" variant="secondary" onPress={onCancel} />
                </View>
            ) : (
                <View style={styles.row}>
                    <Text style={sharedStyles.screenTitle}>{title}</Text>
                    <IconButton icon="✎" variant="primary" onPress={onStartEdit} />
                </View>
            )}

            {isEditing ? (
                <AppInput
                    style={sharedStyles.screenSubtitle}
                    value={description}
                    onChangeText={onChangeDescription}
                    placeholder="Description"
                    multiline
                />
            ) : description ? (
                <Text style={sharedStyles.screenSubtitle}>{description}</Text>
            ) : null}

            {isEditing ? (
                <>
                    <AppButton
                        style={styles.actionButton}
                        title="Save Changes"
                        variant="success"
                        onPress={onSave}
                    />

                    <AppButton title="Delete Routine" variant="danger" onPress={onDelete} />
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
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    actionButton: {
        marginBottom: spacing.lg,
    },
});
