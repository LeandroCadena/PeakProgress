import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";

import { colors, spacing } from "../../theme";

type Props = {
    children: ReactNode;
    scroll?: boolean;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
};

export default function ScreenContainer({ children, scroll = false, style, contentStyle }: Props) {
    if (scroll) {
        return (
            <ScrollView
                style={[styles.container, style]}
                contentContainerStyle={[styles.content, contentStyle]}
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.content, contentStyle]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingTop: spacing.xxl,
        paddingBottom: 120,
    },
});
