// theme/sharedStyles.ts

import { StyleSheet } from "react-native";

import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const sharedStyles = StyleSheet.create({
    screenTitle: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightBold,
        marginBottom: spacing.lg,
    },
    screenSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.subtitle,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.subtitle,
        fontWeight: typography.weightBold,
        marginBottom: spacing.md,
    },
    cardTitle: {
        color: colors.text,
        fontSize: typography.body,
        fontWeight: typography.weightSemiBold,
        marginBottom: spacing.xs,
    },
    mutedText: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontSize: typography.caption,
    },
});
