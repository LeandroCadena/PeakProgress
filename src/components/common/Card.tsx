import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { componentStyles, useAppTheme, createThemedStyles } from "../../theme";

type Props = {
    children: ReactNode;
    style?: StyleProp<ViewStyle> | ViewStyle[];
};

export default function Card({ children, style }: Props) {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    return <View style={[styles.card, style]}>{children}</View>;
}

const getStyles = createThemedStyles((colors) => ({
    card: {
        backgroundColor: colors.card,
        borderRadius: componentStyles.cardRadius,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
        padding: componentStyles.cardPadding,
    },
}));
