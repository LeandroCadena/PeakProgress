import { Image, Pressable, Text, View } from "react-native";

import { localizedExerciseText, localizedCatalogLabel } from "../../i18n/exerciseText";
import { useLanguage } from "../../i18n/LanguageProvider";
import { componentStyles, spacing, typography, useAppTheme, createThemedStyles } from "../../theme";
import { Exercise } from "../../types/exercise";
import AppButton from "../common/AppButton";
import Card from "../common/Card";

type Props = {
    exercise: Exercise;
    alreadyAdded?: boolean;
    showAddButton?: boolean;
    onAdd?: () => void;
    onMoreInfo: () => void;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: () => void;
};

export default function ExerciseListCard({
    exercise,
    alreadyAdded = false,
    showAddButton = false,
    onAdd,
    onMoreInfo,
    selectable = false,
    selected = false,
    onSelect,
}: Props) {
    const { language, t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const card = (
        <Card
            style={[
                alreadyAdded && styles.cardAdded,
                selectable && selected && styles.cardSelected,
            ]}
        >
            <View style={styles.header}>
                {exercise.image_url ? (
                    <Image source={{ uri: exercise.image_url }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderText}>{t("noExerciseImage")}</Text>
                    </View>
                )}

                <View style={styles.info}>
                    <Text style={sharedStyles.screenTitle}>
                        {localizedExerciseText(exercise, "name", language)}
                    </Text>

                    <Text style={styles.text}>
                        {localizedCatalogLabel(exercise.equipment, language) ?? t("noEquipment")} ·{" "}
                        {localizedCatalogLabel(exercise.difficulty, language) ?? t("noDifficulty")}
                    </Text>

                    {alreadyAdded ? (
                        <Text style={styles.alreadyAddedText}>{t("alreadyAdded")}</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.actions}>
                <AppButton
                    title={t("moreInfo")}
                    variant="secondary"
                    onPress={onMoreInfo}
                    style={styles.actionButton}
                />

                {selectable ? (
                    <View style={styles.selectionIndicator}>
                        <Text style={styles.selectionText}>
                            {selected ? t("selected") : t("select")}
                        </Text>
                    </View>
                ) : showAddButton ? (
                    <AppButton
                        title={alreadyAdded ? t("added") : t("add")}
                        variant="success"
                        disabled={alreadyAdded}
                        onPress={onAdd ?? (() => {})}
                        style={styles.actionButton}
                    />
                ) : null}
            </View>
        </Card>
    );

    if (!selectable) return card;

    return (
        <Pressable
            onPress={onSelect}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
        >
            {card}
        </Pressable>
    );
}

const getStyles = createThemedStyles((colors) => ({
    selectionIndicator: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    selectionText: {
        color: colors.text,
        fontWeight: typography.weightBold,
    },
    cardSelected: {
        borderColor: colors.success,
        backgroundColor: colors.successDark,
    },
    cardAdded: {
        borderColor: colors.success,
        backgroundColor: colors.successDark,
    },
    header: {
        flexDirection: "row",
        gap: spacing.md,
    },
    image: {
        width: 92,
        height: 92,
        borderRadius: componentStyles.imageRadius,
        backgroundColor: colors.background,
    },
    imagePlaceholder: {
        width: 92,
        height: 92,
        borderRadius: componentStyles.imageRadius,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        color: colors.textSecondary,
        fontSize: typography.small,
    },
    info: {
        flex: 1,
        minWidth: 0,
        justifyContent: "flex-start",
    },
    text: {
        color: colors.textSecondary,
    },
    alreadyAddedText: {
        color: colors.success,
        marginTop: spacing.xs,
        fontWeight: typography.weightBold,
    },
    actions: {
        marginTop: spacing.lg,
        flexDirection: "row",
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
    },
}));
