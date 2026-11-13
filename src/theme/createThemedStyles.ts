import { StyleSheet } from "react-native";

import { darkTheme } from "./dark";

export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
    createStyles: (colors: typeof darkTheme.colors) => T
) {
    const cache = new WeakMap<typeof darkTheme.colors, T>();

    return (colors: typeof darkTheme.colors): T => {
        const cached = cache.get(colors);
        if (cached !== undefined) return cached;

        const styles = StyleSheet.create(createStyles(colors));
        cache.set(colors, styles);
        return styles;
    };
}
