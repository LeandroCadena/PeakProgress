import { getDatabase } from "./database";

export async function verifyDatabase(): Promise<void> {
    const db = await getDatabase();

    const version = await db.getFirstAsync<{
        user_version: number;
    }>("PRAGMA user_version;");

    const tables = await db.getAllAsync<{
        name: string;
    }>(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name;
    `);

    const syncOperationsColumns = await db.getAllAsync<{
        name: string;
    }>("PRAGMA table_info(sync_operations);");

    console.log("[SQLite] Database version:", version?.user_version);
    console.log(
        "[SQLite] Tables:",
        tables.map((table) => table.name)
    );
    console.log(
        "[SQLite] Sync operations columns:",
        syncOperationsColumns.map((column) => column.name)
    );

    if (version?.user_version !== 5) {
        throw new Error("Unexpected SQLite database version.");
    }

    const requiredTables = [
        "sync_operations",
        "local_routines",
        "local_routine_exercises",
        "local_routine_exercise_sets",
    ];

    for (const tableName of requiredTables) {
        if (!tables.some((table) => table.name === tableName)) {
            throw new Error(`Missing SQLite table: ${tableName}`);
        }
    }

    console.log("[SQLite] Verification successful.");
}
