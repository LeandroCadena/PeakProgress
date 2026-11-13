import type { Ref } from "react";
import { TextInput, TextInputProps } from "react-native";

import { componentStyles, spacing, useAppTheme, createThemedStyles } from "../../theme";

type Props = TextInputProps & {
    disabled?: boolean;
    ref?: Ref<TextInput>;
};

export default function AppInput({ style, disabled, editable, ...props }: Props) {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const isEditable = editable ?? !disabled;

    return (
        <TextInput
            {...props}
            editable={isEditable}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, !isEditable && styles.disabled, style]}
        />
    );
}

const getStyles = createThemedStyles((colors) => ({
    input: {
        backgroundColor: colors.inputBackground,
        color: colors.text,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.inputBorder,
        borderRadius: componentStyles.inputRadius,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    disabled: {
        opacity: 0.6,
    },
}));
