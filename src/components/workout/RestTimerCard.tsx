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
    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.timer}>{timer}s</Text>
            </View>

            <Pressable
                style={styles.restartButton}
                onPress={onRestart}
                accessibilityRole="button"
                accessibilityLabel={t("restartRestTimer")}
            >
                <Ionicons name="reload-outline" size={28} color={colors.text} />
            </Pressable>
        </View>
    );
}

const getStyles = createThemedStyles((colors) => ({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    label: {
        color: colors.textSecondary,
        fontSize: typography.caption,
        marginBottom: spacing.xs,
    },
    timer: {
        color: colors.text,
        fontSize: 36,
        fontWeight: typography.weightExtraBold,
        marginLeft: 20,
    },
    lastTimerText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    restartButton: {
        width: 50,
        height: 40,
        borderRadius: 22,
        borderWidth: 1,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 20,
    },
}));
