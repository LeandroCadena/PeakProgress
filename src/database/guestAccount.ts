import { getDatabase } from "./database";

export const GUEST_USER_ID = "local-guest";

export async function attachGuestData(userId: string) {
    const db = await getDatabase();

    await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync(
            "UPDATE local_routines SET user_id = ? WHERE user_id = ?",
            userId,
            GUEST_USER_ID
        );
        await tx.runAsync(
            "UPDATE sync_operations SET user_id = ? WHERE user_id = ?",
            userId,
            GUEST_USER_ID
        );
        await tx.runAsync(
            "UPDATE local_workouts SET user_id = ? WHERE user_id = ?",
            userId,
            GUEST_USER_ID
        );
        await tx.runAsync(
            `INSERT INTO local_user_preferences (user_id, kind, value)
             SELECT ?, kind, value FROM local_user_preferences WHERE user_id = ?
             ON CONFLICT (user_id, kind) DO UPDATE SET value = CASE
                 WHEN excluded.kind = 'weight' THEN (
                     SELECT json_group_array(json(log.value))
                     FROM (
                         SELECT value FROM json_each(excluded.value)
                         UNION ALL
                         SELECT value FROM json_each(local_user_preferences.value)
                     ) AS log
                 )
                 ELSE excluded.value
             END`,
            userId,
            GUEST_USER_ID
        );
        await tx.runAsync("DELETE FROM local_user_preferences WHERE user_id = ?", GUEST_USER_ID);
    });
}
