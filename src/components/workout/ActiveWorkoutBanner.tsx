import { Ionicons } from "@expo/vector-icons";
import { Clock3, Hourglass } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useLanguage } from "../../i18n/LanguageProvider";
import { spacing, typography, componentStyles, useAppTheme, createThemedStyles } from "../../theme";
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
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    return (
        <Pressable onPress={onPress}>
            <Card style={styles.banner}>
                <View style={styles.left}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="barbell-outline" size={22} color={colors.success} />
                    </View>

                    <View style={styles.details}>
                        <Text style={styles.label}>{t("workoutRunning").toUpperCase()}</Text>
                        <Text style={styles.routineName}>{routineName}</Text>
                    </View>
                </View>

                <View style={styles.right}>
                    <View style={styles.metric}>
                        <Clock3 size={18} color={colors.success} />
                        <Text style={styles.metricText}>{elapsedText}</Text>
                    </View>

                    {restRemainingText ? (
                        <View style={styles.metric}>
                            <Hourglass size={18} color={colors.warning} />
                            <Text style={styles.metricText}>{restRemainingText}</Text>
                        </View>
                    ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Card>
        </Pressable>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
        gap: spacing.sm,
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
    details: { flex: 1, minWidth: 0 },
    right: {
        alignItems: "flex-start",
        gap: spacing.sm,
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
    metric: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    metricText: {
        color: colors.text,
        fontWeight: typography.weightBold,
    },
}));
