import * as SQLite from "expo-sqlite";

import { runMigrations } from "./migrations";

const DATABASE_NAME = process.env.NODE_ENV === "test" ? ":memory:" : "peakprogress.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!databasePromise) {
        databasePromise = initializeDatabase().catch((error) => {
            databasePromise = null;
            throw error;
        });
    }

    return databasePromise;
}

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    try {
        await runMigrations(db);
        return db;
    } catch (error) {
        await db.closeAsync();
        throw error;
    }
}
