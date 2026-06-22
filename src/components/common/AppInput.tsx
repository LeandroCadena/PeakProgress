import { TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, componentStyles, spacing } from "../../theme";

type Props = TextInputProps & {
    disabled?: boolean;
};

export default function AppInput({ style, disabled, editable, ...props }: Props) {
    const isEditable = editable ?? !disabled;

    return (
        <TextInput
            {...props}
            editable={isEditable}
            placeholderTextColor={colors.textSecondary}
            style={[
                styles.input,
                !isEditable && styles.disabled,
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: colors.inputBackground,
        color: colors.text,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
        borderRadius: componentStyles.inputRadius,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    disabled: {
        opacity: 0.6,
    },
});