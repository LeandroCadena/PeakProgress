import { getDatabase } from "./database";
import { getLocalRoutine, saveLocalRoutine } from "./repositories/routineRepository";

export async function runSyncStatusDiagnostics(): Promise<void> {
    const db = await getDatabase();

    const userId = "diagnostic-sync-status-user";
    const routineId = "diagnostic-sync-status-routine";
    const operationId = "diagnostic-sync-status-operation";

    const snapshot = {
        routineId,
        name: "Diagnostic routine",
        exercises: [],
        setsByExerciseId: {},
    };

    try {
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE user_id = ?`,
            [userId]
        );

        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        await saveLocalRoutine({
            userId,
            snapshot,
        });

        await db.runAsync(
            `UPDATE local_routines
             SET remote_version = 7
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        await saveLocalRoutine({
            userId,
            snapshot: {
                ...snapshot,
                name: "Locally modified routine",
            },
            syncOperationId: operationId,
        });

        const pending = await db.getFirstAsync<{
            remote_version: number | null;
            sync_status: string;
        }>(
            `SELECT remote_version, sync_status
             FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );

        if (pending?.remote_version !== 7 || pending.sync_status !== "pending") {
            throw new Error("Local changes did not preserve version and pending status.");
        }

        let overwriteRejected = false;

        try {
            await saveLocalRoutine({
                userId,
                snapshot: {
                    ...snapshot,
                    name: "Unexpected remote overwrite",
                },
            });
        } catch {
            overwriteRejected = true;
        }

        if (!overwriteRejected) {
            throw new Error("A pending routine was overwritten without a sync operation.");
        }

        const stored = await getLocalRoutine({
            userId,
            routineId,
        });

        if (stored?.name !== "Locally modified routine") {
            throw new Error("The local routine was unexpectedly modified.");
        }

        console.log("[SQLite] Sync status diagnostics passed.");
    } finally {
        await db.runAsync(
            `DELETE FROM sync_operations
             WHERE user_id = ?`,
            [userId]
        );

        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );
    }
}
