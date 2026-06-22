import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

type Props = {
    title?: string;
    message?: string;
};

export default function LoadingCard({
    title = "Preparing workout...",
    message = "Setting up your exercises and sets.",
}: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: 16,
        padding: spacing.xl,
        marginVertical: spacing.lg,
    },
    title: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
    },
    message: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 20,
    },
});