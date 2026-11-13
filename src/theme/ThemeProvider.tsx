import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import StartupScreen from "../components/common/StartupScreen";
import { useLanguage } from "../i18n/LanguageProvider";

import { darkTheme } from "./dark";
import { lightTheme } from "./light";
import { getSharedStyles } from "./sharedStyles";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "peakprogress.theme";

type ThemeContextValue = {
    preference: ThemePreference;
    isDark: boolean;
    colors: typeof darkTheme.colors;
    sharedStyles: ReturnType<typeof getSharedStyles>;
    setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { t } = useLanguage();
    const systemScheme = useColorScheme();
    const [preference, setPreference] = useState<ThemePreference>("dark");
    const [ready, setReady] = useState(false);
    const pendingWrite = useRef(Promise.resolve());

    useEffect(() => {
        let active = true;
        void AsyncStorage.getItem(storageKey)
            .then((value) => {
                if (active && (value === "light" || value === "dark" || value === "system")) {
                    setPreference(value);
                }
            })
            .catch((error: unknown) => console.warn("Could not read appearance preference:", error))
            .finally(() => {
                if (active) setReady(true);
            });
        return () => {
            active = false;
        };
    }, []);

    function persistPreference(value: ThemePreference): Promise<void> {
        const operation = pendingWrite.current.then(async () => {
            await AsyncStorage.setItem(storageKey, value);
            setPreference(value);
        });
        pendingWrite.current = operation.catch(() => {});
        return operation;
    }

    if (!ready) return <StartupScreen message={t("startupPreparing")} />;

    const isDark = preference === "system" ? systemScheme !== "light" : preference === "dark";
    const colors = isDark ? darkTheme.colors : lightTheme.colors;

    return (
        <ThemeContext.Provider
            value={{
                preference,
                isDark,
                colors,
                sharedStyles: getSharedStyles(colors),
                setPreference: persistPreference,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    const theme = useContext(ThemeContext);
    if (!theme) throw new Error("useAppTheme must be used inside ThemeProvider.");
    return theme;
}
