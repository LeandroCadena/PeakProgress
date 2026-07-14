import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable, {
    SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import {
    colors,
    componentStyles,
    typography,
} from "../../theme";

const ACTION_WIDTH = 88;
const SWIPE_AREA_WIDTH = 64;

type Props = {
    children: ReactNode;
    enabled?: boolean;
    isDragging?: boolean;
    showSwipeHint?: boolean;
    compact?: boolean;
    actionLabel?: string;
    onActionPress: () => void;
};

export default function SwipeableCard({
    children,
    enabled = true,
    isDragging = false,
    showSwipeHint = false,
    compact = false,
    actionLabel,
    onActionPress,
}: Props) {
    const swipeableRef = useRef<SwipeableMethods>(null);

    function handleActionPress() {
        swipeableRef.current?.close();
        onActionPress();
    }

    function renderRightActions() {
        return (
            <View
                style={[
                    styles.actionContainer,
                    compact && styles.compactActionContainer,
                ]}
            >
                <Pressable
                    style={[
                        styles.action,
                        compact && styles.compactAction,
                    ]}
                    onPress={handleActionPress}
                >
                    <Ionicons
                        name="trash-outline"
                        size={22}
                        color={colors.text}
                    />

                    {
                        actionLabel && (
                            <Text style={styles.actionText}>
                                {actionLabel}
                            </Text>
                        )
                    }
                </Pressable>
            </View>
        );
    }

    return (
        <Swipeable
            ref={swipeableRef}
            enabled={enabled && !isDragging}
            friction={2}
            rightThreshold={40}
            dragOffsetFromRightEdge={-20}
            overshootRight={false}
            hitSlop={{
                right: 0,
                width: SWIPE_AREA_WIDTH,
            }}
            renderRightActions={renderRightActions}
            containerStyle={[
                styles.container,
                compact && styles.compactContainer,
            ]}
            childrenContainerStyle={[
                styles.childrenContainer,
                compact && styles.compactChildrenContainer,
            ]}
        >
            <View style={styles.content}>
                {showSwipeHint ? (
                    <LinearGradient
                        colors={[
                            "rgba(249, 115, 22, 0)",
                            "rgba(249, 115, 22, 0.10)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        pointerEvents="none"
                        style={styles.swipeHint}
                    />
                ) : null}

                {children}
            </View>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopRightRadius: componentStyles.cardRadius,
        borderBottomRightRadius: componentStyles.cardRadius,
        overflow: "hidden",
        backgroundColor: colors.danger,
    },
    compactContainer: {
        overflow: "visible",
        backgroundColor: colors.danger,
    },
    childrenContainer: {
        backgroundColor: colors.card,
        borderTopRightRadius: componentStyles.cardRadius,
        borderBottomRightRadius: componentStyles.cardRadius,
    },
    compactChildrenContainer: {
        borderTopRightRadius: componentStyles.inputRadius,
        borderBottomRightRadius: componentStyles.inputRadius,
        overflow: "hidden",
    },
    compactActionContainer: {
        borderTopRightRadius: componentStyles.inputRadius,
        borderBottomRightRadius: componentStyles.inputRadius,
        overflow: "hidden",
    },
    content: {
        position: "relative",
    },
    swipeHint: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
    actionContainer: {
        width: ACTION_WIDTH,
        height: "100%",
        backgroundColor: colors.danger,
        shadowColor: "#c42222",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: {
            width: -3,
            height: 0,
        },
        elevation: 6,
    },
    action: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    actionText: {
        color: colors.text,
        fontSize: typography.small,
        fontWeight: typography.weightBold,
    },
    compactAction: {
        borderTopRightRadius: componentStyles.inputRadius,
        borderBottomRightRadius: componentStyles.inputRadius,
        backgroundColor: colors.danger,
    },
});