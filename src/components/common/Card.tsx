import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, componentStyles, spacing } from "../../theme";

type Props = {
    children: ReactNode;
    style?: ViewStyle | ViewStyle[];
};

export default function Card({ children, style }: Props) {
    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: componentStyles.cardRadius,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
        padding: spacing.lg,
    },
});