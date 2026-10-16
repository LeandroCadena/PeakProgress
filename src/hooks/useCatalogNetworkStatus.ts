import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

type CatalogNetworkStatus = "checking" | "offline" | "wifi" | "cellular" | "other";

export function useCatalogNetworkStatus(): CatalogNetworkStatus {
    const [status, setStatus] = useState<CatalogNetworkStatus>("checking");

    useEffect(() => {
        let active = true;

        function updateStatus(state: {
            type: string;
            isConnected: boolean | null;
            isInternetReachable: boolean | null;
        }) {
            if (!active) return;

            if (state.isConnected === false || state.isInternetReachable === false) {
                setStatus("offline");
                return;
            }

            if (state.isConnected !== true || state.isInternetReachable !== true) {
                setStatus("checking");
                return;
            }

            if (state.type === "wifi") {
                setStatus("wifi");
            } else if (state.type === "cellular") {
                setStatus("cellular");
            } else {
                setStatus("other");
            }
        }

        const unsubscribe = NetInfo.addEventListener(updateStatus);

        void NetInfo.fetch()
            .then(updateStatus)
            .catch((error) => {
                console.warn("[Catalog] Network status unavailable:", error);
            });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return status;
}
