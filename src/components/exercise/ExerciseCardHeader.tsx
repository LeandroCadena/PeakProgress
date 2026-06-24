import { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors, componentStyles, sharedStyles, spacing } from "../../theme";

type Props = {
    imageUrl?: string | null;
    title: string;
    rightContent?: ReactNode;
};

export default function ExerciseCardHeader({ imageUrl, title, rightContent }: Props) {
    return (
        <View style={styles.header}>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}

            <View style={styles.info}>
                <Text style={sharedStyles.cardTitle}>{title}</Text>
            </View>

            {rightContent ? <View style={styles.rightContent}>{rightContent}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        gap: spacing.md,
    },
    image: {
        width: 86,
        height: 86,
        borderRadius: componentStyles.imageRadius,
        backgroundColor: colors.background,
    },
    info: {
        flex: 1,
        justifyContent: "flex-start",
    },
    rightContent: {
        height: 86,
        justifyContent: "center",
    },
});
