import * as SQLite from "expo-sqlite";

describe("SQLite integration environment", () => {
    it("opens a real SQLite database and executes SQL", async () => {
        const db = await SQLite.openDatabaseAsync(":memory:");

        try {
            await db.execAsync(`
        CREATE TABLE integration_test (
          id INTEGER PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

            await db.runAsync(
                "INSERT INTO integration_test (id, value) VALUES (?, ?)",
                1,
                "PeakProgress"
            );

            const row = await db.getFirstAsync<{ value: string }>(
                "SELECT value FROM integration_test WHERE id = ?",
                1
            );

            expect(row?.value).toBe("PeakProgress");
        } finally {
            await db.closeAsync();
        }
    });
});
