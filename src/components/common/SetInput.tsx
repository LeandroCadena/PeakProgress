import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import AppInput from "./AppInput";

type Props = TextInputProps & { disabled?: boolean };

export default function SetInput({ style, disabled, onBlur, onFocus, ...props }: Props) {
    const input = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, style]}>
            <View pointerEvents={focused && !disabled ? "auto" : "none"} style={styles.container}>
                <AppInput
                    {...props}
                    ref={input}
                    disabled={disabled}
                    accessible={focused}
                    importantForAccessibility={focused ? "auto" : "no"}
                    style={styles.input}
                    onFocus={(event) => {
                        setFocused(true);
                        onFocus?.(event);
                    }}
                    onBlur={(event) => {
                        setFocused(false);
                        onBlur?.(event);
                    }}
                />
            </View>
            {!focused && !disabled && (
                <Pressable
                    style={StyleSheet.absoluteFill}
                    accessibilityRole="button"
                    accessibilityLabel={props.accessibilityLabel}
                    accessibilityValue={{ text: props.value }}
                    onPress={() => input.current?.focus()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { justifyContent: "center", flex: 1 },
    input: { flex: 1, paddingVertical: 0 },
});
