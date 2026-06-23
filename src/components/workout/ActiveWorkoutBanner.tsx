import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography, componentStyles } from "../../theme";

type Props = {
    routineName: string;
    elapsedText: string;
    restRemainingText?: string;
    onPress: () => void;
};

export default function ActiveWorkoutBanner({
    routineName,
    elapsedText,
    restRemainingText,
    onPress,
}: Props) {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <View>
                <Text style={styles.label}>Workout running</Text>
                <Text style={styles.title}>{routineName}</Text>
            </View>

            {restRemainingText ? (
                <Text style={styles.restText}>Rest: {restRemainingText}</Text>
            ) : null}

            <Text style={styles.time}>{elapsedText}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#143021",
        borderColor: colors.success,
        borderWidth: componentStyles.borderWidth,
        borderRadius: componentStyles.cardRadius,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        color: colors.success,
        fontWeight: "700",
        marginBottom: spacing.xs,
    },
    title: {
        color: colors.text,
        fontWeight: "800",
        fontSize: typography.body,
    },
    time: {
        color: colors.text,
        fontWeight: "800",
    },
    restText: {
        color: colors.warning,
        fontWeight: "800",
        marginTop: spacing.xs,
    },
});
