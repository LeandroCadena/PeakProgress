import { Text, StyleSheet } from "react-native";

import { colors, sharedStyles, spacing } from "../../theme";

import Card from "./Card";

type Props = {
    title?: string;
    message?: string;
};

export default function LoadingCard({
    title = "Preparing workout...",
    message = "Setting up your exercises and sets.",
}: Props) {
    return (
        <Card style={styles.card}>
            <Text style={sharedStyles.screenTitle}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginVertical: spacing.lg,
    },
    message: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 20,
    },
});
