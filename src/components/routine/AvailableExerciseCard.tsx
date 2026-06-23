import { Pressable, Text, StyleSheet } from "react-native";
import Card from "../common/Card";
import { colors, spacing, typography } from "../../theme";

type AvailableExercise = {
    id: string;
    name: string;
};

type Props = {
    exercise: AvailableExercise;
    onPress: () => void;
};

export default function AvailableExerciseCard({ exercise, onPress }: Props) {
    return (
        <Pressable onPress={onPress}>
            <Card style={styles.addCard}>
                <Text style={styles.cardTitle}>{exercise.name}</Text>
                <Text style={styles.cardText}>Tap to add</Text>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    addCard: {
        borderColor: colors.success,
        backgroundColor: colors.successDark,
    },

    cardTitle: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: "700",
    },

    cardText: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});