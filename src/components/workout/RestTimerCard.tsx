import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable } from "react-native";

import { useLanguage } from "../../i18n/LanguageProvider";
import { spacing, typography, useAppTheme, createThemedStyles } from "../../theme";

type Props = {
    timer: number;
    lastTimerDuration: number;
    onRestart: () => void;
};

export default function RestTimerCard({ timer, lastTimerDuration, onRestart }: Props) {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const progress =
        lastTimerDuration > 0 ? Math.min(1, Math.max(0, timer / lastTimerDuration)) : 0;

    return (
        <View style={styles.header}>
            <Text style={styles.timer}>{timer}s</Text>
            <View
                style={styles.track}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={t("restTimerProgress")}
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
            >
                <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <Pressable
                style={[styles.restartButton, lastTimerDuration <= 0 && styles.disabled]}
                onPress={onRestart}
                disabled={lastTimerDuration <= 0}
                accessibilityRole="button"
                accessibilityLabel={t("restartRestTimer")}
            >
                <Ionicons name="reload-outline" size={20} color={colors.text} />
            </Pressable>
        </View>
    );
}

const getStyles = createThemedStyles((colors) => ({
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    timer: {
        color: colors.text,
        fontSize: 24,
        fontWeight: typography.weightExtraBold,
        fontVariant: ["tabular-nums"],
    },
    track: {
        flex: 1,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.cardBorder,
        overflow: "hidden",
    },
    fill: { height: "100%", backgroundColor: "#F97316" },
    restartButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    disabled: { opacity: 0.45 },
}));
