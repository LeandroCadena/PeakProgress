import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useCallback } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { colors, componentStyles } from "../../theme";

const CARD_DELETE_THRESHOLD = 64;
const COMPACT_DELETE_THRESHOLD = 52;
const DELETE_ARMED_COLOR = "#991B1B";

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
    const { width: screenWidth } = useWindowDimensions();

    const translateX = useSharedValue(0);
    const isDeleting = useSharedValue(false);

    const deleteThreshold =
        fullSwipeThreshold ?? (compact ? COMPACT_DELETE_THRESHOLD : CARD_DELETE_THRESHOLD);

    const finishDelete = useCallback(() => {
        onActionPress();
    }, [onActionPress]);

    const panGesture = Gesture.Pan()
        .enabled(enabled && !isDragging)

        // Solo se activa después de un movimiento horizontal claro.
        .activeOffsetX([-14, 14])

        // Si el movimiento se vuelve vertical, el swipe falla
        // y el ScrollView puede tomar el control.
        .failOffsetY([-10, 10])

        .onUpdate((event) => {
            if (isDeleting.get()) {
                return;
            }

            // Solo permitimos mover hacia la izquierda.
            translateX.set(Math.min(0, event.translationX));
        })
        .onEnd(() => {
            const swipeDistance = Math.abs(translateX.get());

            if (swipeDistance < deleteThreshold) {
                translateX.set(
                    withSpring(0, {
                        damping: 20,
                        stiffness: 220,
                        mass: 0.7,
                    })
                );

                return;
            }

            isDeleting.set(true);

            translateX.set(
                withTiming(
                    -screenWidth,
                    {
                        duration: 180,
                    },
                    (finished) => {
                        if (finished) {
                            runOnJS(finishDelete)();
                        }
                    }
                )
            );
        })
        .onFinalize(() => {
            if (!isDeleting.get() && Math.abs(translateX.get()) < deleteThreshold) {
                translateX.set(
                    withSpring(0, {
                        damping: 20,
                        stiffness: 220,
                        mass: 0.7,
                    })
                );
            }
        });

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: translateX.get(),
            },
        ],
    }));

    const animatedDeleteBackgroundStyle = useAnimatedStyle(() => {
        const distance = Math.abs(translateX.get());

        const darkeningEnd = Math.max(deleteThreshold + 1, screenWidth * 0.65);

        return {
            backgroundColor: interpolateColor(
                distance,
                [0, deleteThreshold, darkeningEnd],
                [colors.danger, colors.danger, DELETE_ARMED_COLOR]
            ),
        };
    });

    const animatedCardOverlayStyle = useAnimatedStyle(() => {
        const distance = Math.abs(translateX.get());
        const darkeningEnd = Math.max(deleteThreshold + 1, screenWidth * 0.65);

        return {
            opacity: interpolate(
                distance,
                [0, deleteThreshold, darkeningEnd],
                [0, 0, 0.32],
                Extrapolation.CLAMP
            ),
        };
    });

    const animatedDeleteIconStyle = useAnimatedStyle(() => {
        const distance = Math.abs(translateX.get());

        return {
            opacity: interpolate(distance, [8, deleteThreshold], [0, 1], Extrapolation.CLAMP),
            transform: [
                {
                    scale: interpolate(
                        distance,
                        [0, deleteThreshold, deleteThreshold * 2],
                        [0.75, 1, 1.15],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    return (
        <View style={[styles.container, compact && styles.compactContainer]}>
            <Animated.View
                style={[
                    styles.deleteBackground,
                    compact && styles.compactDeleteBackground,
                    animatedDeleteBackgroundStyle,
                ]}
            >
                <Animated.View
                    style={[
                        styles.deleteIcon,
                        compact && styles.compactDeleteIcon,
                        animatedDeleteIconStyle,
                    ]}
                >
                    <Ionicons name="trash" size={compact ? 20 : 24} color={colors.text} />
                </Animated.View>
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

                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.deleteOverlay,
                                compact && styles.compactDeleteOverlay,
                                animatedCardOverlayStyle,
                            ]}
                        />
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
    deleteOverlay: {
        ...StyleSheet.absoluteFill,
        zIndex: 10,
        borderRadius: componentStyles.cardRadius,
        backgroundColor: "#000000",
    },
    compactDeleteOverlay: {
        borderRadius: componentStyles.inputRadius,
    },
    swipeHint: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
    nonInteractive: {
        pointerEvents: "none",
    },
});
