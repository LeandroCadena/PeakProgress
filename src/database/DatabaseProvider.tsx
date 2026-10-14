
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Button,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getDatabase } from "./database";
import { verifyDatabase } from "./databaseDiagnostics";

type DatabaseStatus = "loading" | "ready" | "error";

export function DatabaseProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [status, setStatus] = useState<DatabaseStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const initialize = useCallback(async () => {
        setStatus("loading");
        setErrorMessage(null);

        try {
            await getDatabase();
            await verifyDatabase();
            setStatus("ready");
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to initialize local database."
            );
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        void initialize();
    }, [initialize]);

    if (status === "loading") {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text style={styles.message}>
                    Preparing local database...
                </Text>
            </View>
        );
    }

    if (status === "error") {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    Unable to prepare local database.
                </Text>
                {errorMessage ? (
                    <Text style={styles.error}>{errorMessage}</Text>
                ) : null}
                <Button title="Retry" onPress={() => void initialize()} />
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 16,
    },
    message: {
        textAlign: "center",
    },
    error: {
        color: "#C62828",
        textAlign: "center",
    },
});
