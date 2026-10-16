import { SQLiteBindValue } from "expo-sqlite";

import type { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

import { getDatabase } from "./database";

type CatalogExercise = Exercise & {
    is_active: number;
};

type CatalogChange = {
    version: number;
    entity_type: "exercises" | "muscles" | "muscle_regions" | "exercise_muscles";
    entity_id: string;
    operation: "upsert" | "delete";
    payload: Record<string, unknown> | null;
};

const TABLES = {
    exercises: "catalog_exercises",
    muscles: "catalog_muscles",
    muscle_regions: "catalog_muscle_regions",
    exercise_muscles: "catalog_exercise_muscles",
} as const;

export async function getLocalMuscles(): Promise<Muscle[]> {
    const db = await getDatabase();

    return db.getAllAsync<Muscle>(`
        SELECT id, name
        FROM catalog_muscles
        ORDER BY name COLLATE NOCASE
    `);
}

export async function getLocalMuscleRegions(): Promise<MuscleRegion[]> {
    const db = await getDatabase();

    return db.getAllAsync<MuscleRegion>(`
        SELECT id, name
        FROM catalog_muscle_regions
        ORDER BY name COLLATE NOCASE
    `);
}

export async function getLocalExercisesByFilter(params: {
    filterMode: FilterMode;
    selectedIds: string[];
}): Promise<Exercise[]> {
    const db = await getDatabase();

    const ids = [...new Set(params.selectedIds)];

    let sql = `
        SELECT DISTINCT
            e.id,
            e.name,
            e.equipment,
            e.difficulty,
            e.image_url
        FROM catalog_exercises e
        WHERE e.is_active = 1
    `;

    if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(", ");

        if (params.filterMode === "muscle") {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM catalog_exercise_muscles em
                    WHERE em.exercise_id = e.id
                      AND em.muscle_id IN (${placeholders})
                )
            `;
        } else {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM catalog_exercise_muscles em
                    JOIN catalog_muscles m
                      ON m.id = em.muscle_id
                    WHERE em.exercise_id = e.id
                      AND m.region_id IN (${placeholders})
                )
            `;
        }
    }

    sql += " ORDER BY e.name COLLATE NOCASE";

    return db.getAllAsync<Exercise>(sql, ...ids);
}

export async function getLocalExerciseDetail(exerciseId: string) {
    const db = await getDatabase();

    const exercise = await db.getFirstAsync<CatalogExercise>(
        `SELECT *
         FROM catalog_exercises
         WHERE id = ?`,
        exerciseId
    );

    if (!exercise) return null;

    const relations = await db.getAllAsync<{
        role: string | null;
        name: string | null;
    }>(
        `SELECT em.role, m.name
         FROM catalog_exercise_muscles em
         LEFT JOIN catalog_muscles m
           ON m.id = em.muscle_id
         WHERE em.exercise_id = ?
         ORDER BY m.name COLLATE NOCASE`,
        exerciseId
    );

    return {
        ...exercise,
        exercise_muscles: relations.map((relation) => ({
            role: relation.role,
            muscles: relation.name ? { name: relation.name } : null,
        })),
    };
}

export async function getCatalogSyncVersion(): Promise<number> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{
        last_version: number;
    }>(
        `SELECT last_version
         FROM catalog_sync_state
         WHERE id = 1`
    );

    return row?.last_version ?? 0;
}

export async function applyCatalogChanges(changes: CatalogChange[]): Promise<void> {
    if (!changes.length) return;

    const db = await getDatabase();

    await db.withExclusiveTransactionAsync(async (tx) => {
        const state = await tx.getFirstAsync<{
            last_version: number;
        }>(
            `SELECT last_version
             FROM catalog_sync_state
             WHERE id = 1`
        );

        let cursor = state?.last_version ?? 0;

        for (const change of changes) {
            if (!Number.isSafeInteger(change.version)) {
                throw new Error("Invalid catalog version");
            }

            if (change.version <= cursor) continue;

            const table = TABLES[change.entity_type];

            if (!table) {
                throw new Error("Unknown catalog entity type");
            }

            if (change.operation === "delete") {
                await tx.runAsync(`DELETE FROM ${table} WHERE id = ?`, change.entity_id);
            } else if (change.operation === "upsert") {
                if (!change.payload) {
                    throw new Error("Missing catalog payload");
                }

                const columnsByEntity = {
                    exercises: [
                        "id",
                        "name",
                        "description",
                        "instructions",
                        "tips",
                        "equipment",
                        "difficulty",
                        "image_url",
                        "animation_url",
                        "is_active",
                        "created_at",
                    ],
                    muscles: ["id", "name", "region_id", "created_at"],
                    muscle_regions: ["id", "name", "created_at"],
                    exercise_muscles: ["id", "exercise_id", "muscle_id", "role", "created_at"],
                } as const;

                const columns = columnsByEntity[change.entity_type];

                const values: SQLiteBindValue[] = columns.map((column) => {
                    const value = change.payload?.[column];

                    if (column === "is_active") {
                        if (typeof value !== "boolean") {
                            throw new Error("Invalid exercise is_active value");
                        }

                        return value ? 1 : 0;
                    }

                    if (value === null || value === undefined) {
                        return null;
                    }

                    if (typeof value === "string" || typeof value === "number") {
                        return value;
                    }

                    throw new Error(`Invalid catalog payload field: ${column}`);
                });

                if (change.payload.id !== change.entity_id) {
                    throw new Error("Catalog entity ID mismatch");
                }

                const placeholders = columns.map(() => "?").join(", ");

                const updates = columns
                    .filter((column) => column !== "id")
                    .map((column) => `${column} = excluded.${column}`)
                    .join(", ");

                await tx.runAsync(
                    `INSERT INTO ${table} (${columns.join(", ")})
                     VALUES (${placeholders})
                     ON CONFLICT(id) DO UPDATE SET ${updates}`,
                    ...values
                );
            } else {
                throw new Error("Unknown catalog operation");
            }

            cursor = change.version;
        }

        await tx.runAsync(
            `UPDATE catalog_sync_state
             SET last_version = ?,
                 last_synced_at = ?
             WHERE id = 1`,
            cursor,
            new Date().toISOString()
        );
    });
}
