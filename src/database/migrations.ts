import type * as SQLite from "expo-sqlite";

const DATABASE_VERSION = 10;

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync("PRAGMA foreign_keys = ON;");

    const result = await db.getFirstAsync<{
        user_version: number;
    }>("PRAGMA user_version;");

    const currentVersion = result?.user_version ?? 0;

    if (currentVersion > DATABASE_VERSION) {
        throw new Error(`Unsupported database version: ${currentVersion}`);
    }

    if (currentVersion === DATABASE_VERSION) {
        return;
    }

    await db.withExclusiveTransactionAsync(async (tx) => {
        if (currentVersion < 1) {
            await tx.execAsync(`
                CREATE TABLE IF NOT EXISTS sync_operations (
                    id TEXT PRIMARY KEY NOT NULL,
                    user_id TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    operation_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending'
                        CHECK (
                            status IN (
                                'pending',
                                'processing',
                                'failed'
                            )
                        ),
                    attempts INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS
                    idx_sync_operations_user_status
                ON sync_operations (
                    user_id,
                    status,
                    created_at
                );
            `);
        }

        if (currentVersion < 2) {
            await tx.execAsync(`
                CREATE TABLE IF NOT EXISTS local_routines (
                    id TEXT PRIMARY KEY NOT NULL,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted_at TEXT
                );

                CREATE INDEX IF NOT EXISTS
                    idx_local_routines_user
                ON local_routines (
                    user_id,
                    deleted_at
                );

                CREATE TABLE IF NOT EXISTS local_routine_exercises (
                    id TEXT PRIMARY KEY NOT NULL,
                    routine_id TEXT NOT NULL,
                    exercise_id TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    rest_seconds INTEGER NOT NULL DEFAULT 90,
                    exercise_rest_seconds INTEGER NOT NULL DEFAULT 120,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,

                    FOREIGN KEY (routine_id)
                        REFERENCES local_routines(id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS
                    idx_local_routine_exercises_routine
                ON local_routine_exercises (
                    routine_id,
                    position
                );

                CREATE TABLE IF NOT EXISTS local_routine_exercise_sets (
                    id TEXT PRIMARY KEY NOT NULL,
                    routine_exercise_id TEXT NOT NULL,
                    reps INTEGER NOT NULL DEFAULT 0,
                    weight REAL NOT NULL DEFAULT 0,
                    is_pr INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,

                    FOREIGN KEY (routine_exercise_id)
                        REFERENCES local_routine_exercises(id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS
                    idx_local_routine_sets_exercise
                ON local_routine_exercise_sets (
                    routine_exercise_id
                );
            `);
        }

        if (currentVersion < 3) {
            await tx.execAsync(`
        ALTER TABLE local_routine_exercises
        ADD COLUMN exercise_name TEXT;

        ALTER TABLE local_routine_exercises
        ADD COLUMN exercise_image_url TEXT;
    `);
        }

        if (currentVersion < 4) {
            await tx.execAsync(`
        ALTER TABLE sync_operations
        ADD COLUMN lease_token TEXT;
    `);
        }

        if (currentVersion < 5) {
            await tx.execAsync(`
        ALTER TABLE local_routines
        ADD COLUMN remote_version INTEGER;

        ALTER TABLE local_routines
        ADD COLUMN sync_status TEXT NOT NULL
        DEFAULT 'synced'
        CHECK (
            sync_status IN (
                'synced',
                'pending',
                'conflict'
            )
        );
    `);

            await tx.runAsync(`
        UPDATE local_routines
        SET sync_status = 'pending'
        WHERE EXISTS (
            SELECT 1
            FROM sync_operations AS so
            WHERE so.user_id = local_routines.user_id
              AND so.entity_type = 'routine'
              AND so.entity_id = local_routines.id
        )
    `);
        }

        if (currentVersion < 6) {
            await tx.execAsync(`
                CREATE TABLE sync_operations_v6 (
                    id TEXT PRIMARY KEY NOT NULL,
                    user_id TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    operation_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending'
                        CHECK (
                            status IN (
                                'pending',
                                'processing',
                                'failed',
                                'conflict'
                            )
                        ),
                    attempts INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    lease_token TEXT
                );

                INSERT INTO sync_operations_v6 (
                    id,
                    user_id,
                    entity_type,
                    entity_id,
                    operation_type,
                    payload,
                    status,
                    attempts,
                    created_at,
                    updated_at,
                    lease_token
                )
                SELECT
                    id,
                    user_id,
                    entity_type,
                    entity_id,
                    operation_type,
                    payload,
                    status,
                    attempts,
                    created_at,
                    updated_at,
                    lease_token
                FROM sync_operations
                ORDER BY rowid ASC;

                DROP TABLE sync_operations;

                ALTER TABLE sync_operations_v6
                RENAME TO sync_operations;

                CREATE INDEX idx_sync_operations_user_status
                ON sync_operations (
                    user_id,
                    status,
                    created_at
                );
            `);
        }

        if (currentVersion < 7) {
            await tx.execAsync(`
                CREATE TABLE IF NOT EXISTS routine_sync_conflicts (
                    operation_id TEXT PRIMARY KEY NOT NULL,
                    user_id TEXT NOT NULL,
                    routine_id TEXT NOT NULL,
                    remote_version INTEGER NOT NULL
                        CHECK (remote_version >= 0),
                    remote_snapshot TEXT,
                    created_at TEXT NOT NULL,

                    FOREIGN KEY (operation_id)
                        REFERENCES sync_operations(id)
                        ON DELETE CASCADE,

                    FOREIGN KEY (routine_id)
                        REFERENCES local_routines(id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS
                    idx_routine_sync_conflicts_user_routine
                ON routine_sync_conflicts (
                    user_id,
                    routine_id
                );
            `);
        }

        if (currentVersion < 8) {
            await tx.execAsync(`
        ALTER TABLE sync_operations
        ADD COLUMN expected_version INTEGER
        CHECK (
            expected_version IS NULL
            OR expected_version >= 0
        );
    `);
        }

        if (currentVersion < 9) {
            await tx.execAsync(`
        ALTER TABLE local_routines
        ADD COLUMN remote_state TEXT NOT NULL
        DEFAULT 'unknown'
        CHECK (
            remote_state IN (
                'never_synced',
                'exists',
                'deleted',
                'unknown'
            )
        );

        UPDATE local_routines
        SET remote_state = 'exists'
        WHERE remote_version IS NOT NULL;
    `);
        }

        if (currentVersion < 10) {
            await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS catalog_muscle_regions (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS catalog_muscles (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            region_id TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_muscles_region
            ON catalog_muscles(region_id);

        CREATE TABLE IF NOT EXISTS catalog_exercises (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            instructions TEXT,
            tips TEXT,
            equipment TEXT,
            difficulty TEXT,
            image_url TEXT,
            animation_url TEXT,
            is_active INTEGER NOT NULL DEFAULT 1
                CHECK (is_active IN (0, 1)),
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_exercises_name
            ON catalog_exercises(name);
        CREATE INDEX IF NOT EXISTS idx_catalog_exercises_active
            ON catalog_exercises(is_active, name);

        CREATE TABLE IF NOT EXISTS catalog_exercise_muscles (
            id TEXT PRIMARY KEY NOT NULL,
            exercise_id TEXT NOT NULL,
            muscle_id TEXT NOT NULL,
            role TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_exercise_muscles_exercise
            ON catalog_exercise_muscles(exercise_id);
        CREATE INDEX IF NOT EXISTS idx_catalog_exercise_muscles_muscle
            ON catalog_exercise_muscles(muscle_id);

        CREATE TABLE IF NOT EXISTS catalog_sync_state (
            id INTEGER PRIMARY KEY NOT NULL
                CHECK (id = 1),
            last_version INTEGER NOT NULL DEFAULT 0
                CHECK (last_version >= 0),
            last_synced_at TEXT
        );
        INSERT OR IGNORE INTO catalog_sync_state (
            id, last_version
        ) VALUES (1, 0);

        CREATE TABLE IF NOT EXISTS catalog_preferences (
            id INTEGER PRIMARY KEY NOT NULL
                CHECK (id = 1),
            auto_update_on_cellular INTEGER NOT NULL DEFAULT 0
                CHECK (auto_update_on_cellular IN (0, 1))
        );
        INSERT OR IGNORE INTO catalog_preferences (
            id, auto_update_on_cellular
        ) VALUES (1, 0);
    `);
        }

        await tx.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
}
