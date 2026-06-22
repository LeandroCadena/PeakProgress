import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function EmptyStateCard() {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>No exercises found</Text>

            <Text style={styles.message}>
                This workout doesn't contain any exercises yet.
            </Text>
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
        alignItems: "center",
    },
    title: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
    },
    message: {
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: spacing.sm,
        lineHeight: 20,
    },
});