import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useLanguage } from "../../i18n/LanguageProvider";
import { createThemedStyles, spacing, useAppTheme } from "../../theme";
import { routineCovers, type RoutineCover } from "../../types/routineCover";
import AppButton from "../common/AppButton";
import Card from "../common/Card";

import { routineCoverImages } from "./routineCoverImages";

type Props = {
    visible: boolean;
    cover: RoutineCover;
    onSelect: (cover: RoutineCover) => void;
    onClose: () => void;
};

export default function RoutineCoverPicker({ visible, cover, onSelect, onClose }: Props) {
    const { t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Card style={styles.panel}>
                    <Text style={sharedStyles.screenTitle}>{t("changeRoutineCover")}</Text>
                    <ScrollView contentContainerStyle={styles.grid}>
                        {routineCovers.map((option) => (
                            <Pressable
                                key={option}
                                accessibilityRole="button"
                                accessibilityState={{ selected: cover === option }}
                                onPress={() => onSelect(option)}
                                style={[styles.option, cover === option && styles.selected]}
                            >
                                <Image source={routineCoverImages[option]} style={styles.image} />
                                <Text style={styles.label}>{t(`cover_${option}`)}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                    <AppButton title={t("cancel")} onPress={onClose} variant="secondary" />
                </Card>
            </View>
        </Modal>
    );
}

const getStyles = createThemedStyles((colors) => ({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "#0009",
        justifyContent: "center",
        padding: spacing.lg,
    },
    panel: { maxHeight: "85%", gap: spacing.md },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: spacing.sm,
    },
    option: {
        width: "48%",
        borderWidth: 2,
        borderColor: colors.cardBorder,
        borderRadius: 12,
        overflow: "hidden",
    },
    selected: { borderColor: colors.primary },
    image: { width: "100%", height: 72 },
    label: { color: colors.text, padding: spacing.xs, textAlign: "center" },
}));
