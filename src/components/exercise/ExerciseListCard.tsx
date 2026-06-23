import { Image, View, Text, StyleSheet } from "react-native";

import { colors, componentStyles, spacing, typography } from "../../theme";
import { Exercise } from "../../types/exercise";
import AppButton from "../common/AppButton";
import Card from "../common/Card";

type Props = {
    exercise: Exercise;
    alreadyAdded?: boolean;
    showAddButton?: boolean;
    onAdd?: () => void;
    onMoreInfo: () => void;
};

export default function ExerciseListCard({
    exercise,
    alreadyAdded = false,
    showAddButton = false,
    onAdd,
    onMoreInfo,
}: Props) {
    return (
        <Card style={[styles.card, alreadyAdded ? styles.cardAdded : null]}>
            <View style={styles.header}>
                {exercise.image_url ? (
                    <Image source={{ uri: exercise.image_url }} style={styles.image} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderText}>No image</Text>
                    </View>
                )}

                <View style={styles.info}>
                    <Text style={styles.title}>{exercise.name}</Text>

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
                <AppButton title="More Info" variant="secondary" onPress={onMoreInfo} />

                {showAddButton ? (
                    <AppButton
                        title={alreadyAdded ? "Added" : "Add"}
                        variant="success"
                        disabled={alreadyAdded}
                        onPress={onAdd ?? (() => { })}
                    />
                ) : null}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.md,
    },
    cardAdded: {
        borderColor: colors.success,
        backgroundColor: colors.successDark,
        borderWidth: 2,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    image: {
        width: 72,
        height: 72,
        borderRadius: componentStyles.imageRadius,
        backgroundColor: colors.background,
    },
    imagePlaceholder: {
        width: 72,
        height: 72,
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
    },
    title: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: typography.weightExtraBold,
    },
    text: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    alreadyAddedText: {
        color: colors.success,
        marginTop: spacing.xs,
        fontWeight: typography.weightBold,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
});