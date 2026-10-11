import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import AppToast, { type AppToastType } from "../components/common/AppToast";

type ToastOptions = {
    type?: AppToastType;
    message: string;
    duration?: number;
};

type ToastState = ToastOptions & {
    id: number;
};

type ToastContextValue = {
    showToast: (options: ToastOptions) => void;
    hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = useCallback((options: ToastOptions) => {
        setToast({
            ...options,
            id: Date.now(),
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const contextValue = useMemo(
        () => ({ showToast, hideToast }),
        [showToast, hideToast]
    );

    return (
        <ToastContext.Provider value={contextValue}>
            <View style={styles.container}>
                {children}

                <AppToast
                    key={toast?.id ?? "empty"}
                    visible={toast !== null}
                    message={toast?.message ?? ""}
                    type={toast?.type ?? "info"}
                    duration={toast?.duration}
                    onDismiss={hideToast}
                />
            </View>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }

    return context;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});