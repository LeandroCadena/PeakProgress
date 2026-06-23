import { StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "../../theme";

type Props = {
    children: React.ReactNode;
};

export default function SectionTitle({ children }: Props) {
    return (
        <Text style={styles.title}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: "800",
        marginBottom: spacing.md,
    },
});