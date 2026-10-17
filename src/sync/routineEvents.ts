type RoutineChangeListener = (userId: string) => void;

const listeners = new Set<RoutineChangeListener>();

export function subscribeToRoutineChanges(listener: RoutineChangeListener): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function notifyRoutineChanges(userId: string): void {
    for (const listener of listeners) {
        try {
            listener(userId);
        } catch (error) {
            console.warn("Routine change listener failed:", error);
        }
    }
}
