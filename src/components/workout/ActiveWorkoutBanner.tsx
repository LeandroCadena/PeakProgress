import { Ionicons } from "@expo/vector-icons";
import { Clock3, Hourglass } from "lucide-react-native"; //remove later
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
                        <Ionicons name="barbell-outline" size={22} color={colors.success} />
                    </View>

                    <View>
                        <Text style={styles.label}>WORKOUT RUNNING</Text>
                        <Text style={styles.routineName}>{routineName}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.right}>
                    <View style={styles.metric}>
                        <Clock3 size={18} color={colors.success} />
                        <Text style={styles.metricText}>{elapsedText}</Text>
                    </View>

                    {restRemainingText ? (
                        <>
                            <View style={styles.smallDivider} />

                            <View style={styles.metric}>
                                <Hourglass size={18} color={colors.warning} />
                                <Text style={styles.metricText}>{restRemainingText}</Text>
                            </View>
                        </>
                    ) : null}

                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </View>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    label: {
        color: colors.success,
        fontWeight: typography.weightBold,
        fontSize: typography.small,
        marginBottom: spacing.xs,
    },
    banner: {
        backgroundColor: colors.successDark,
        borderColor: colors.success,
        borderWidth: componentStyles.borderWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
        paddingTop: 14,
        paddingBottom: 14,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: spacing.md,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    icon: {
        fontSize: 20,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    routineName: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: typography.weightBold,
    },
    divider: {
        width: 1,
        height: 44,
        backgroundColor: colors.cardBorder,
        marginHorizontal: spacing.md,
        opacity: 0.8,
    },
    smallDivider: {
        width: 1,
        height: 18,
        backgroundColor: colors.cardBorder,
        marginHorizontal: spacing.xs,
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
});
