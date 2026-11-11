import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

import { messages, type Language, type MessageKey } from "./messages";

const storageKey = "peakprogress.language";

type LanguageContextValue = {
    language: Language;
    setLanguage: (language: Language) => Promise<void>;
    t: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [ready, setReady] = useState(false);
    const pendingWrite = useRef(Promise.resolve());

    useEffect(() => {
        let active = true;

        void AsyncStorage.getItem(storageKey)
            .then((stored) => {
                if (active && (stored === "en" || stored === "es")) setLanguage(stored);
            })
            .catch((error: unknown) => console.warn("Could not read language preference:", error))
            .finally(() => {
                if (active) setReady(true);
            });

        return () => {
            active = false;
        };
    }, []);

    function persistLanguage(next: Language): Promise<void> {
        const operation = pendingWrite.current.then(async () => {
            await AsyncStorage.setItem(storageKey, next);
            setLanguage(next);
        });
        pendingWrite.current = operation.catch(() => {});
        return operation;
    }

    const t = useCallback((key: MessageKey) => messages[language][key], [language]);

    if (!ready) return null;

    return (
        <LanguageContext.Provider value={{ language, setLanguage: persistLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
    return context;
}
