import { useCallback, useEffect, useState } from "react";

import StartupScreen from "../components/common/StartupScreen";
import { useLanguage } from "../i18n/LanguageProvider";

import { getDatabase } from "./database";
import { verifyDatabase } from "./databaseDiagnostics";

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
    const { t } = useLanguage();
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    const initialize = useCallback(async () => {
        setStatus("loading");

        try {
            await getDatabase();
            await verifyDatabase();
            setStatus("ready");
        } catch (error) {
            console.warn("Unable to prepare local storage:", error);
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        void initialize();
    }, [initialize]);

    if (status === "loading") return <StartupScreen message={t("startupDatabase")} />;

    if (status === "error") {
        return (
            <StartupScreen
                message={t("startupDatabaseError")}
                loading={false}
                action={{ label: t("startupRetry"), onPress: initialize }}
            />
        );
    }

    return <>{children}</>;
}
