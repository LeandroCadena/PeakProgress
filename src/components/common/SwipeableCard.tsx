import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

import { colors, componentStyles } from "../../theme";

const CARD_DELETE_THRESHOLD = 64;
const COMPACT_DELETE_THRESHOLD = 52;

type Props = {
    children: ReactNode;
    enabled?: boolean;
    isDragging?: boolean;
    showSwipeHint?: boolean;
    compact?: boolean;
    actionLabel?: string;
    fullSwipeThreshold?: number;
    onActionPress: () => void;
};

export default function SwipeableCard({
    children,
    enabled = true,
    isDragging = false,
    showSwipeHint = false,
    compact = false,
    fullSwipeThreshold,
    onActionPress,
}: Props) {
    const translateX = useSharedValue(0);
    const gestureStartX = useSharedValue(0);

    const deleteThreshold =
        fullSwipeThreshold ?? (compact ? COMPACT_DELETE_THRESHOLD : CARD_DELETE_THRESHOLD);

    const actionWidth = compact ? COMPACT_DELETE_THRESHOLD : CARD_DELETE_THRESHOLD;

    const panGesture = Gesture.Pan()
        .enabled(enabled && !isDragging)
        .activeOffsetX([-14, 14])
        .failOffsetY([-10, 10])
        .onBegin(() => {
            gestureStartX.set(translateX.get());
        })
        .onUpdate((event) => {
            // Keep the action partially or fully revealed; never delete on swipe.
            translateX.set(Math.max(-actionWidth, Math.min(0, gestureStartX.get() + event.translationX)));
        })
        .onEnd(() => {
            const shouldOpen = Math.abs(translateX.get()) >= Math.min(deleteThreshold, actionWidth) / 2;
            translateX.set(withSpring(shouldOpen ? -actionWidth : 0, {
                damping: 20,
                stiffness: 220,
                mass: 0.7,
            }));
        });

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.get(),
            },
        ],
    }));

    const animatedDeleteIconStyle = useAnimatedStyle(() => ({
        opacity: Math.min(1, Math.abs(translateX.get()) / 16),
    }));

    return (
        <View style={[styles.container, compact && styles.compactContainer]}>
            <Animated.View
                style={[
                    styles.deleteBackground,
                    compact && styles.compactDeleteBackground,
                ]}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete"
                    disabled={!enabled || isDragging}
                    onPress={onActionPress}
                    style={[styles.deleteIcon, compact && styles.compactDeleteIcon]}
                >
                    <Animated.View style={animatedDeleteIconStyle}>
                        <Ionicons name="trash" size={compact ? 20 : 24} color={colors.text} />
                    </Animated.View>
                </Pressable>
            </Animated.View>

            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[
                        styles.childrenContainer,
                        compact && styles.compactChildrenContainer,
                        animatedCardStyle,
                    ]}
                >
                    <View style={styles.content}>
                        {showSwipeHint ? (
                            <LinearGradient
                                colors={["rgba(249, 115, 22, 0)", "rgba(249, 115, 22, 0.10)"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                pointerEvents="none"
                                style={styles.swipeHint}
                            />
                        ) : null}

                        {children}

                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        overflow: "hidden",
        borderRadius: componentStyles.cardRadius,
        backgroundColor: colors.danger,
    },
    compactContainer: {
        borderRadius: componentStyles.inputRadius,
    },
    childrenContainer: {
        position: "relative",
        zIndex: 2,
        borderRadius: componentStyles.cardRadius,
        overflow: "hidden",
        backgroundColor: colors.card,
    },
    compactChildrenContainer: {
        borderRadius: componentStyles.inputRadius,
    },
    content: {
        position: "relative",
    },
    deleteBackground: {
        ...StyleSheet.absoluteFill,
        alignItems: "flex-end",
        justifyContent: "center",
        borderRadius: componentStyles.cardRadius,
    },
    compactDeleteBackground: {
        borderRadius: componentStyles.inputRadius,
    },
    deleteIcon: {
        width: 64,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    compactDeleteIcon: {
        width: 52,
    },
    swipeHint: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
});
