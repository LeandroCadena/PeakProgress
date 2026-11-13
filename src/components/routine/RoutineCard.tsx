import { Ionicons } from "@expo/vector-icons";
import { Text, View, Image, Pressable } from "react-native";

import { useLanguage } from "../../i18n/LanguageProvider";
import { componentStyles, spacing, typography, useAppTheme, createThemedStyles } from "../../theme";
import type { RoutineCover } from "../../types/routineCover";
import Card from "../common/Card";

import { defaultRoutineCover, routineCoverImages } from "./routineCoverImages";

type Props = {
    cover?: RoutineCover;
    title: string;
    subtitle?: string;
    onEdit?: () => void;
    onStart?: () => void;
    startDisabled?: boolean;
    imageUrl?: string;
};

export default function RoutineCard({
    title,
    subtitle,
    onEdit,
    onStart,
    startDisabled,
    imageUrl,
    cover,
}: Props) {
    const { t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    return (
        <Card>
            <View style={styles.routineContent}>
                <Image
                    source={
                        cover
                            ? routineCoverImages[cover]
                            : imageUrl
                              ? { uri: imageUrl }
                              : defaultRoutineCover
                    }
                    style={styles.routineImage}
                />

                <View style={styles.routineInfo}>
                    <Text style={styles.title}>{title}</Text>

                    <Text style={sharedStyles.mutedText}>{subtitle}</Text>
                </View>

                {onEdit && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("editRoutine")}
                        style={styles.button}
                        onPress={onEdit}
                    >
                        <Ionicons name="pencil-outline" size={22} color={colors.text} />
                    </Pressable>
                )}
                {onStart && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("startRoutineWorkout")}
                        style={[styles.button, styles.start, startDisabled && styles.disabled]}
                        disabled={startDisabled}
                        onPress={onStart}
                    >
                        <Ionicons name="barbell-outline" size={23} color={colors.onAccent} />
                    </Pressable>
                )}
            </View>
        </Card>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
        width: 44,
        height: 44,
        marginLeft: spacing.xs,
        borderRadius: componentStyles.buttonRadius,
        alignItems: "center",
        justifyContent: "center",
    },
    start: { backgroundColor: colors.primary },
    disabled: {
        opacity: 0.5,
    },
}));
