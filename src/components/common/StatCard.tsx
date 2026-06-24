import { StyleSheet, Text } from "react-native";

import { colors, sharedStyles, spacing, typography } from "../../theme";

import Card from "./Card";

type Props = {
    label: string;
    value: string | number;
    helper?: string;
};

export default function StatCard({ label, value, helper }: Props) {
    return (
        <Card style={styles.card}>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>

            {helper ? <Text style={sharedStyles.mutedText}>{helper}</Text> : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
    },
    value: {
        color: colors.text,
        fontSize: 32,
        fontWeight: typography.weightBlack,
    },
    label: {
        color: colors.text,
        fontWeight: typography.weightExtraBold,
        marginTop: spacing.xs,
    },
});
