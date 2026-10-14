import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "../context/AuthContext";
import { drainRoutineSyncQueue } from "../services/sync/routineSyncCoordinator";

const POLL_INTERVAL_MS = 30_000;

/** Mounted only after SQLite is initialized and while an auth session exists. */
export default function RoutineSyncCoordinator() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let foreground = AppState.currentState === "active";
    let online = false;

    const run = () => {
      if (disposed || !foreground || !online) return;
      void drainRoutineSyncQueue(userId).catch((error: unknown) => {
        console.warn("Routine synchronization could not run:", error);
      });
    };

    const networkSubscription = NetInfo.addEventListener((state) => {
      // Treat unknown reachability conservatively: do not send until confirmed.
      online = state.isConnected === true && state.isInternetReachable === true;
      run();
    });
    const appSubscription = AppState.addEventListener("change", (state) => {
      foreground = state === "active";
      run();
    });
    const interval = setInterval(run, POLL_INTERVAL_MS);

    // NetInfo's initial event can be delayed; fetch the current state as well.
    void NetInfo.fetch().then((state) => {
      if (disposed) return;
      online = state.isConnected === true && state.isInternetReachable === true;
      run();
    }).catch((error: unknown) => console.warn("Network check failed:", error));

    return () => {
      disposed = true;
      clearInterval(interval);
      appSubscription.remove();
      networkSubscription();
    };
  }, [userId]);

  return null;
}
