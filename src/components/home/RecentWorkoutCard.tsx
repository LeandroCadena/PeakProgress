import { Text, View, StyleSheet } from "react-native";

import { colors, spacing, typography } from "../../theme";
import Card from "../common/Card";

type Props = {
    title: string;
    date: string;
    duration: string;
    exercisesCount: number;
};

export default function RecentWorkoutCard({ title, date, duration, exercisesCount }: Props) {
    return (
        <Card style={styles.card}>
            <View>
                <Text style={styles.title}>{title}</Text>

                <Text style={styles.meta}>
                    {date} · {duration} · {exercisesCount} exercises
                </Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    title: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: "800",
    },
    meta: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontSize: typography.caption,
    },
});
