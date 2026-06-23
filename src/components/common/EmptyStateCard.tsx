import { Text, StyleSheet } from "react-native";

import { colors, spacing, typography } from "../../theme";

import Card from "./Card";

export default function EmptyStateCard() {
    return (
        <Card style={styles.card}>
            <Text style={styles.title}>No exercises found</Text>

            <Text style={styles.message}>This workout doesn&apos;t contain any exercises yet.</Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
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
