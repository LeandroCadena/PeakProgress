type CatalogListener = () => void;

const listeners = new Set<CatalogListener>();

export function subscribeToCatalogChanges(listener: CatalogListener): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function notifyCatalogChanged(): void {
    for (const listener of [...listeners]) {
        try {
            listener();
        } catch (error) {
            console.warn("[Catalog] Listener failed:", error);
        }
    }
}
