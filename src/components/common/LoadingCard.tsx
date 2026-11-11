import { Text } from "react-native";

import { spacing, useAppTheme, createThemedStyles } from "../../theme";

import Card from "./Card";

type Props = {
    title?: string;
    message?: string;
};

export default function LoadingCard({
    title = "Preparing workout...",
    message = "Setting up your exercises and sets.",
}: Props) {
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    return (
        <Card style={styles.card}>
            <Text style={sharedStyles.screenTitle}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
        </Card>
    );
}

const getStyles = createThemedStyles((colors) => ({
    card: {
        marginVertical: spacing.lg,
    },
    message: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        lineHeight: 20,
    },
}));
