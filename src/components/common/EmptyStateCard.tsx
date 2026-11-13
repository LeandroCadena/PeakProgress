import { Text } from "react-native";

import { spacing, useAppTheme, createThemedStyles } from "../../theme";

import Card from "./Card";

type Props = {
    title: string;
    message: string;
};

export default function EmptyStateCard({ title, message }: Props) {
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
        alignItems: "center",
    },
    message: {
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: spacing.sm,
        lineHeight: 20,
    },
}));
