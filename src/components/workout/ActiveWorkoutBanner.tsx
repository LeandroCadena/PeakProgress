import { ChevronRight, Clock3, Hourglass } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography, componentStyles } from "../../theme";
import Card from "../common/Card";

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
        <Pressable onPress={onPress}>
            <Card style={styles.banner}>
                <View style={styles.left}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>🏋️</Text>
                    </View>

                    <View>
                        <Text style={styles.label}>Workout running</Text>
                        <Text style={styles.routineName}>{routineName}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.right}>
                    <View style={styles.metric}>
                        <Clock3 size={18} color={colors.success} />
                        <Text style={styles.metricText}>
                            {elapsedText}
                        </Text>
                    </View>

                    {restRemainingText ? (
                        <>
                            <View style={styles.smallDivider} />

                            <View style={styles.metric}>
                                <Hourglass size={18} color={colors.warning} />
                                <Text style={styles.metricText}>
                                    {restRemainingText}
                                </Text>
                            </View>
                        </>
                    ) : null}

                    <ChevronRight
                        size={22}
                        color={colors.text}
                    />
                </View>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.successDark,
        borderColor: colors.success,
        borderWidth: componentStyles.borderWidth,
        borderRadius: componentStyles.cardRadius,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        color: colors.success,
        fontWeight: typography.weightExtraBold,
        fontSize: typography.small,
        marginBottom: spacing.xs,
    },
    title: {
        color: colors.text,
        fontWeight: "900",
        fontSize: typography.body,
    },
    time: {
        color: colors.text,
        fontWeight: "900",
        fontSize: typography.caption,
    },
    restText: {
        color: colors.warning,
        fontWeight: "800",
        marginTop: spacing.xs,
        fontSize: typography.small,
    },
    chevron: {
        color: colors.text,
        fontSize: 26,
        fontWeight: typography.weightBold,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    banner: {
        backgroundColor: colors.successDark,
        borderColor: colors.success,
        borderWidth: componentStyles.borderWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: spacing.md,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        fontSize: 20,
    },
    routineName: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: typography.weightExtraBold,
        marginTop: spacing.xs,
    },
    divider: {
        width: 1,
        height: 44,
        backgroundColor: colors.cardBorder,
        marginHorizontal: spacing.md,
        opacity: 0.8,
    },
    timerIcon: {
        color: colors.success,
        fontSize: typography.subtitle,
    },
    elapsedText: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: typography.weightBold,
    },
    metric: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    metricText: {
        color: colors.text,
        fontWeight: typography.weightBold,
    },
    smallDivider: {
        width: 1,
        height: 18,
        backgroundColor: colors.cardBorder,
        marginHorizontal: spacing.xs,
    },
});
