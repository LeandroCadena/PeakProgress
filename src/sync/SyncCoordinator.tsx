
import NetInfo, {
    type NetInfoState,
} from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "../context/AuthContext";
import { syncCatalog } from "../services/catalogSyncService";
import { drainRoutineSyncQueue } from "../services/sync/routineSyncQueueProcessor";

import {
    canAutoSyncCatalog,
    canSyncRoutines,
    CATALOG_RETRY_INTERVAL_MS,
    CATALOG_SYNC_INTERVAL_MS,
    ROUTINE_SYNC_INTERVAL_MS,
} from "./syncPolicy";

export default function SyncCoordinator() {
    const { user } = useAuth();
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;

        let disposed = false;
        let foreground = AppState.currentState === "active";
        let network: NetInfoState | null = null;

        let lastRoutineAttempt = 0;
        let lastCatalogAttempt = 0;
        let catalogRetryDelay = 0;

        let routineRunning = false;
        let catalogRunning = false;

        const runRoutines = () => {
            if (
                disposed ||
                !foreground ||
                !network ||
                !canSyncRoutines(network) ||
                routineRunning
            ) {
                return;
            }

            const now = Date.now();

            if (
                now - lastRoutineAttempt <
                ROUTINE_SYNC_INTERVAL_MS
            ) {
                return;
            }

            lastRoutineAttempt = now;
            routineRunning = true;

            void drainRoutineSyncQueue(userId)
                .catch((error: unknown) => {
                    console.warn(
                        "[Sync] Routine synchronization failed:",
                        error
                    );
                })
                .finally(() => {
                    routineRunning = false;
                });
        };

        const runCatalog = () => {
            if (
                disposed ||
                !foreground ||
                !network ||
                !canAutoSyncCatalog(network) ||
                catalogRunning
            ) {
                return;
            }

            const now = Date.now();
            const interval =
                catalogRetryDelay || CATALOG_SYNC_INTERVAL_MS;

            if (
                lastCatalogAttempt !== 0 &&
                now - lastCatalogAttempt < interval
            ) {
                return;
            }

            lastCatalogAttempt = now;
            catalogRunning = true;

            void syncCatalog()
                .then(() => {
                    catalogRetryDelay = 0;
                })
                .catch((error: unknown) => {
                    catalogRetryDelay = CATALOG_RETRY_INTERVAL_MS;

                    console.warn(
                        "[Sync] Catalog synchronization failed:",
                        error
                    );
                })
                .finally(() => {
                    catalogRunning = false;
                });
        };

        const run = () => {
            runRoutines();
            runCatalog();
        };

        const networkSubscription =
            NetInfo.addEventListener((state) => {
                network = state;
                run();
            });

        const appSubscription = AppState.addEventListener(
            "change",
            (state) => {
                foreground = state === "active";
                run();
            }
        );

        const interval = setInterval(
            run,
            ROUTINE_SYNC_INTERVAL_MS
        );

        void NetInfo.fetch()
            .then((state) => {
                if (disposed) return;
                network = state;
                run();
            })
            .catch((error: unknown) => {
                console.warn("[Sync] Network check failed:", error);
            });

        return () => {
            disposed = true;
            clearInterval(interval);
            networkSubscription();
            appSubscription.remove();
        };
    }, [userId]);

    return null;
}
