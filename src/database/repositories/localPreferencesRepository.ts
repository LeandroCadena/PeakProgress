import { getDatabase } from "../database";

export async function getLocalPreference<T>(userId: string, kind: string): Promise<T | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM local_user_preferences WHERE user_id = ? AND kind = ?",
        userId,
        kind
    );
    return row ? (JSON.parse(row.value) as T) : null;
}

export async function updateLocalPreference<T extends object>(
    userId: string,
    kind: string,
    update: (current: T | null) => T
): Promise<T> {
    const db = await getDatabase();
    let value!: T;
    await db.withExclusiveTransactionAsync(async (tx) => {
        const row = await tx.getFirstAsync<{ value: string }>(
            "SELECT value FROM local_user_preferences WHERE user_id = ? AND kind = ?",
            userId,
            kind
        );
        value = update(row ? (JSON.parse(row.value) as T) : null);
        await tx.runAsync(
            `INSERT INTO local_user_preferences (user_id, kind, value) VALUES (?, ?, ?)
             ON CONFLICT (user_id, kind) DO UPDATE SET value = excluded.value`,
            userId,
            kind,
            JSON.stringify(value)
        );
    });
    return value;
}
