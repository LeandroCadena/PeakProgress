import { useSyncExternalStore } from "react";

import { subscribeToCatalogChanges } from "../sync/catalogEvents";

let revision = 0;

const listeners = new Set<() => void>();

subscribeToCatalogChanges(() => {
    revision += 1;

    for (const listener of [...listeners]) {
        listener();
    }
});

function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot(): number {
    return revision;
}

export function useCatalogRevision(): number {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
