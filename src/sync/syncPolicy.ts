import type { NetInfoState } from "@react-native-community/netinfo";

export const ROUTINE_SYNC_INTERVAL_MS = 30_000;
export const CATALOG_SYNC_INTERVAL_MS = 5 * 60_000;
export const CATALOG_RETRY_INTERVAL_MS = 30_000;

export function isNetworkOnline(state: NetInfoState): boolean {
    return state.isConnected === true && state.isInternetReachable === true;
}

export function canSyncRoutines(state: NetInfoState): boolean {
    return isNetworkOnline(state);
}

export function canAutoSyncCatalog(state: NetInfoState): boolean {
    return isNetworkOnline(state) && state.type === "wifi";
}
