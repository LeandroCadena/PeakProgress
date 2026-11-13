import { ReactNode } from "react";
import { ScrollView, View, ViewStyle } from "react-native";

import { spacing, useAppTheme, createThemedStyles } from "../../theme";

type Props = {
    children: ReactNode;
    scroll?: boolean;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
};

export default function ScreenContainer({ children, scroll = false, style, contentStyle }: Props) {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
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
            <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
}));
