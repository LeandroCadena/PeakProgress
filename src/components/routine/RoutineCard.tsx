import { Ionicons } from "@expo/vector-icons";
import { Text, View, StyleSheet, Image, Pressable } from "react-native";

import { colors, componentStyles, sharedStyles, spacing, typography } from "../../theme";
import Card from "../common/Card";

type Props = {
    title: string;
    subtitle?: string;
    onPress: () => void;
    showButton?: boolean;
    buttonTitle?: string;
    buttonDisabled?: boolean;
    onPressButton?: () => void;
};

export default function RoutineCard({
    title,
    subtitle,
    onPress,
    showButton = false,
    buttonTitle,
    buttonDisabled,
    onPressButton,
}: Props) {
    return (
        <Pressable onPress={onPress}>
            <Card>
                <View style={styles.routineContent}>
                    <Image
                        source={{
                            uri: "",
                        }}
                        style={styles.routineImage}
                    />

                    <View style={styles.routineInfo}>
                        <Text style={styles.title}>{title}</Text>

                        <Text style={sharedStyles.mutedText}>{subtitle}</Text>
                    </View>

                    {showButton ? (
                        <Pressable
                            style={[styles.button, buttonDisabled && styles.disabled]}
                            disabled={buttonDisabled}
                            onPress={onPressButton ?? (() => {})}
                        >
                            <Text style={styles.text}>{buttonTitle}</Text>
                        </Pressable>
                    ) : null}

                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </View>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: typography.weightMedium,
    },
    routineContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    routineImage: {
        width: 48,
        height: 48,
        borderRadius: 32,
        backgroundColor: colors.background,
    },
    routineInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    button: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: componentStyles.buttonRadius,
        backgroundColor: colors.success,
        alignItems: "center",
        justifyContent: "center",
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: colors.text,
        fontWeight: typography.weightMedium,
        fontSize: typography.subtitle,
        textAlign: "center",
    },
});
