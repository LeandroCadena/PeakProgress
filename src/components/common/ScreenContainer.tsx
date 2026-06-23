import { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

import { colors, spacing } from "../../theme";

type Props = {
    children: ReactNode;
    style?: ViewStyle | ViewStyle[];
};

export default function ScreenContainer({ children, style }: Props) {
    return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xxl,
        paddingTop: 64,
    },
});
