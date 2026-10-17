import { DatabaseSync } from "node:sqlite";

type BindValue = string | number | null | Uint8Array;
type BindParams = (BindValue | BindValue[])[];

function normalizeParams(params: BindParams): BindValue[] {
    return params.flat();
}

export type TestDatabase = {
    execAsync(sql: string): Promise<void>;

    runAsync(
        sql: string,
        ...params: BindParams
    ): Promise<{
        changes: number;
        lastInsertRowId: number;
    }>;

    getFirstAsync<T>(sql: string, ...params: BindParams): Promise<T | null>;

    getAllAsync<T>(sql: string, ...params: BindParams): Promise<T[]>;

    withExclusiveTransactionAsync<T>(task: (tx: TestDatabase) => Promise<T>): Promise<T>;

    closeAsync(): Promise<void>;
};

export function createTestDatabase(): TestDatabase {
    const sqlite = new DatabaseSync(":memory:");

    const database: TestDatabase = {
        async execAsync(sql) {
            sqlite.exec(sql);
        },

        async runAsync(sql, ...params) {
            const result = sqlite.prepare(sql).run(...normalizeParams(params));

            return {
                changes: Number(result.changes),
                lastInsertRowId: Number(result.lastInsertRowid),
            };
        },

        async getFirstAsync<T>(sql: string, ...params: BindParams): Promise<T | null> {
            const row = sqlite.prepare(sql).get(...normalizeParams(params));
            return (row ?? null) as T | null;
        },

        async getAllAsync<T>(sql: string, ...params: BindParams): Promise<T[]> {
            return sqlite.prepare(sql).all(...normalizeParams(params)) as T[];
        },

        async withExclusiveTransactionAsync<T>(task: (tx: TestDatabase) => Promise<T>): Promise<T> {
            sqlite.exec("BEGIN IMMEDIATE");

            try {
                const result = await task(database);
                sqlite.exec("COMMIT");
                return result;
            } catch (error) {
                if (sqlite.isTransaction) {
                    sqlite.exec("ROLLBACK");
                }
                throw error;
            }
        },

        async closeAsync() {
            sqlite.close();
        },
    };

    return database;
}
