import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, componentStyles, sharedStyles, spacing, typography } from "../../theme";
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
    const card = (
        <Card style={[alreadyAdded && styles.cardAdded, selectable && selected && styles.cardSelected]}>
            <View style={styles.header}>
                {exercise.image_url ? (
                    <Image source={{ uri: exercise.image_url }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderText}>No image</Text>
                    </View>
                )}

                <View style={styles.info}>
                    <Text style={sharedStyles.screenTitle}>{exercise.name}</Text>

                    <Text style={styles.text}>
                        {exercise.equipment ?? "No equipment"} ·{" "}
                        {exercise.difficulty ?? "No difficulty"}
                    </Text>

                    {alreadyAdded ? (
                        <Text style={styles.alreadyAddedText}>Already added</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.actions}>
                <AppButton
                    title="More Info"
                    variant="secondary"
                    onPress={onMoreInfo}
                    style={styles.actionButton}
                />

                {selectable ? (
                    <View style={styles.selectionIndicator}>
                        <Text style={styles.selectionText}>{selected ? "✓ Selected" : "Select"}</Text>
                    </View>
                ) : showAddButton ? (
                    <AppButton
                        title={alreadyAdded ? "Added" : "Add"}
                        variant="success"
                        disabled={alreadyAdded}
                        onPress={onAdd ?? (() => { })}
                        style={styles.actionButton}
                    />
                ) : null}
            </View>
        </Card>
    );

    if (!selectable) return card;

    return (
        <Pressable onPress={onSelect} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
            {card}
        </Pressable>
    );
}

const styles = StyleSheet.create({
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
});
