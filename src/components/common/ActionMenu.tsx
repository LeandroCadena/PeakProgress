import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useCallback, useRef, useState } from "react";
import {
    LayoutRectangle,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

import { colors, componentStyles, spacing, typography } from "../../theme";

type ActionMenuItem = {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    destructive?: boolean;
    disabled?: boolean;
    onPress: () => void;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: ActionMenuItem[];
    trigger: ReactNode;
    disabled?: boolean;
};

const MENU_WIDTH = 190;
const SCREEN_EDGE_PADDING = 12;

export default function ActionMenu({
    open,
    onOpenChange,
    items,
    trigger,
    disabled = false,
}: Props) {
    const triggerRef = useRef<View>(null);

    const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);

    const openMenu = useCallback(() => {
        if (disabled) {
            return;
        }

        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setTriggerLayout({
                x,
                y,
                width,
                height,
            });

            onOpenChange(true);
        });
    }, [disabled, onOpenChange]);

    const closeMenu = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    const handleItemPress = useCallback(
        (item: ActionMenuItem) => {
            if (item.disabled) {
                return;
            }

            closeMenu();
            item.onPress();
        },
        [closeMenu]
    );

    const menuTop = triggerLayout ? triggerLayout.y + triggerLayout.height + spacing.xs : 0;

    const { width: screenWidth } = useWindowDimensions();

    const menuLeft = triggerLayout
        ? Math.min(
              screenWidth - MENU_WIDTH - SCREEN_EDGE_PADDING,
              Math.max(SCREEN_EDGE_PADDING, triggerLayout.x + triggerLayout.width - MENU_WIDTH)
          )
        : SCREEN_EDGE_PADDING;

    return (
        <>
            <View ref={triggerRef} collapsable={false}>
                <Pressable
                    onPress={openMenu}
                    disabled={disabled}
                    hitSlop={10}
                    style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
                >
                    {trigger}
                </Pressable>
            </View>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={closeMenu}
            >
                <View style={styles.modalContainer}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />

                    {triggerLayout ? (
                        <View
                            style={[
                                styles.menu,
                                {
                                    top: menuTop,
                                    left: menuLeft,
                                },
                            ]}
                        >
                            {items.map((item) => (
                                <Pressable
                                    key={item.key}
                                    disabled={item.disabled}
                                    onPress={() => handleItemPress(item)}
                                    style={({ pressed }) => [
                                        styles.menuItem,
                                        pressed && styles.menuItemPressed,
                                        item.disabled && styles.menuItemDisabled,
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={20}
                                        color={item.destructive ? colors.danger : colors.text}
                                    />

                                    <Text
                                        style={[
                                            styles.menuItemText,
                                            item.destructive && styles.destructiveText,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        alignItems: "center",
        justifyContent: "center",
        minWidth: 36,
        minHeight: 36,
        borderRadius: componentStyles.inputRadius,
    },
    triggerPressed: {
        opacity: 0.65,
    },
    modalContainer: {
        flex: 1,
    },
    menu: {
        position: "absolute",
        width: MENU_WIDTH,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: componentStyles.inputRadius,
        backgroundColor: colors.card,
        elevation: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5,
        },
    },
    menuItem: {
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    menuItemPressed: {
        backgroundColor: colors.background,
    },
    menuItemDisabled: {
        opacity: 0.45,
    },
    menuItemText: {
        flex: 1,
        color: colors.text,
        fontSize: typography.body,
        fontWeight: typography.weightMedium,
    },
    destructiveText: {
        color: colors.danger,
    },
});
