type RoutineVersionAcknowledgement = {
    routineId: string;
    previousVersion: number | null;
    remoteVersion: number;
};

type RoutineChangeListener = (
    userId: string,
    acknowledgement?: RoutineVersionAcknowledgement
) => void;

const listeners = new Set<RoutineChangeListener>();

export function subscribeToRoutineChanges(listener: RoutineChangeListener): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function notifyRoutineChanges(
    userId: string,
    acknowledgement?: RoutineVersionAcknowledgement
): void {
    for (const listener of listeners) {
        try {
            listener(userId, acknowledgement);
        } catch (error) {
            console.warn("Routine change listener failed:", error);
        }
    }
}
