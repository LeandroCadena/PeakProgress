import {
    applyCatalogChanges,
    getCatalogSyncVersion,
    getLocalExercisesByFilter,
    getLocalMuscleRegions,
} from "../../src/database/catalogRepository";
import { getDatabase } from "../../src/database/database";
import { runMigrations } from "../../src/database/migrations";

import { createTestDatabase } from "./helpers/nodeSqliteAdapter";

jest.mock("../../src/database/database", () => ({
    getDatabase: jest.fn(),
}));

const mockGetDatabase = jest.mocked(getDatabase);

describe("Catalog repository SQLite integration", () => {
    let db: ReturnType<typeof createTestDatabase>;

    beforeEach(async () => {
        db = createTestDatabase();

        mockGetDatabase.mockResolvedValue(db as any);

        await runMigrations(db as any);
    });

    afterEach(async () => {
        await db.closeAsync();
        jest.resetAllMocks();
    });

    it("applies catalog changes and persists the cursor", async () => {
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-1",
                operation: "upsert",
                payload: {
                    id: "region-1",
                    name: "Upper Body",
                },
            },
        ]);

        const region = await db.getFirstAsync<{
            id: string;
            name: string;
        }>("SELECT id, name FROM catalog_muscle_regions WHERE id = ?", "region-1");

        expect(region).toEqual({
            id: "region-1",
            name: "Upper Body",
        });

        expect(await getCatalogSyncVersion()).toBe(1);
    });

    it("rolls back all changes when a SQLite write fails", async () => {
        expect(await getCatalogSyncVersion()).toBe(0);

        await expect(
            applyCatalogChanges([
                {
                    version: 1,
                    entity_type: "muscle_regions",
                    entity_id: "region-1",
                    operation: "upsert",
                    payload: {
                        id: "region-1",
                        name: "Upper Body",
                    },
                },
                {
                    version: 2,
                    entity_type: "muscle_regions",
                    entity_id: "region-2",
                    operation: "upsert",
                    payload: {
                        id: "region-2",
                        name: "Lower Body",
                    },
                },
                {
                    version: 3,
                    entity_type: "muscle_regions",
                    entity_id: "region-3",
                    operation: "upsert",
                    payload: {
                        id: "region-3",
                        name: null,
                    },
                },
            ])
        ).rejects.toThrow();

        const regions = await db.getAllAsync<{
            id: string;
            name: string;
        }>("SELECT id, name FROM catalog_muscle_regions ORDER BY id");

        // Neither valid record should survive the failed transaction.
        expect(regions).toEqual([]);

        // The synchronization cursor must remain unchanged.
        expect(await getCatalogSyncVersion()).toBe(0);

        const state = await db.getFirstAsync<{
            last_version: number;
            last_synced_at: string | null;
        }>(
            `SELECT last_version, last_synced_at
     FROM catalog_sync_state
     WHERE id = 1`
        );

        expect(state).toEqual({
            last_version: 0,
            last_synced_at: null,
        });
    });

    it("recovers after rollback and successfully retries the page", async () => {
        const validChanges = [
            {
                version: 1,
                entity_type: "muscle_regions" as const,
                entity_id: "region-1",
                operation: "upsert" as const,
                payload: {
                    id: "region-1",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscle_regions" as const,
                entity_id: "region-2",
                operation: "upsert" as const,
                payload: {
                    id: "region-2",
                    name: "Lower Body",
                },
            },
            {
                version: 3,
                entity_type: "muscle_regions" as const,
                entity_id: "region-3",
                operation: "upsert" as const,
                payload: {
                    id: "region-3",
                    name: "Core",
                },
            },
        ];

        // First attempt: the third change violates NOT NULL.
        const invalidChanges = validChanges.map((change) => ({
            ...change,
            payload: { ...change.payload },
        }));

        invalidChanges[2].payload.name = null as unknown as string;

        await expect(applyCatalogChanges(invalidChanges)).rejects.toThrow();

        // Verify that the first attempt left no partial changes.
        expect(await getCatalogSyncVersion()).toBe(0);

        const countAfterFailure = await db.getFirstAsync<{
            total: number;
        }>("SELECT COUNT(*) AS total FROM catalog_muscle_regions");

        expect(countAfterFailure?.total).toBe(0);

        // Second attempt: retry the same page with corrected data.
        await applyCatalogChanges(validChanges);

        expect(await getCatalogSyncVersion()).toBe(3);

        const regions = await db.getAllAsync<{
            id: string;
            name: string;
        }>(
            `SELECT id, name
     FROM catalog_muscle_regions
     ORDER BY id`
        );

        expect(regions).toEqual([
            { id: "region-1", name: "Upper Body" },
            { id: "region-2", name: "Lower Body" },
            { id: "region-3", name: "Core" },
        ]);

        const state = await db.getFirstAsync<{
            last_version: number;
            last_synced_at: string | null;
        }>(
            `SELECT last_version, last_synced_at
     FROM catalog_sync_state
     WHERE id = 1`
        );

        expect(state?.last_version).toBe(3);
        expect(state?.last_synced_at).not.toBeNull();
    });

    it("is idempotent when the same catalog page is applied twice", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions" as const,
                entity_id: "region-1",
                operation: "upsert" as const,
                payload: {
                    id: "region-1",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscle_regions" as const,
                entity_id: "region-2",
                operation: "upsert" as const,
                payload: {
                    id: "region-2",
                    name: "Lower Body",
                },
            },
            {
                version: 3,
                entity_type: "muscle_regions" as const,
                entity_id: "region-3",
                operation: "upsert" as const,
                payload: {
                    id: "region-3",
                    name: "Core",
                },
            },
        ];

        // First application.
        await applyCatalogChanges(changes);

        expect(await getCatalogSyncVersion()).toBe(3);

        const stateBefore = await db.getFirstAsync<{
            last_version: number;
            last_synced_at: string | null;
        }>(
            `SELECT last_version, last_synced_at
     FROM catalog_sync_state
     WHERE id = 1`
        );

        // Second application of exactly the same page.
        await applyCatalogChanges(changes);

        const regions = await db.getAllAsync<{
            id: string;
            name: string;
        }>(
            `SELECT id, name
     FROM catalog_muscle_regions
     ORDER BY id`
        );

        expect(regions).toEqual([
            { id: "region-1", name: "Upper Body" },
            { id: "region-2", name: "Lower Body" },
            { id: "region-3", name: "Core" },
        ]);

        expect(await getCatalogSyncVersion()).toBe(3);

        const stateAfter = await db.getFirstAsync<{
            last_version: number;
            last_synced_at: string | null;
        }>(
            `SELECT last_version, last_synced_at
     FROM catalog_sync_state
     WHERE id = 1`
        );

        expect(stateAfter?.last_version).toBe(stateBefore?.last_version);
    });

    it("updates and deletes catalog exercises correctly", async () => {
        const exerciseId = "exercise-1";

        const originalExercise = {
            id: exerciseId,
            name: "Bench Press",
            description: "Chest exercise",
            instructions: null,
            tips: null,
            equipment: "Barbell",
            difficulty: "Intermediate",
            image_url: null,
            animation_url: null,
            is_active: true,
            created_at: "2026-01-01T00:00:00Z",
        };

        // Version 1: insert the exercise.
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "exercises",
                entity_id: exerciseId,
                operation: "upsert",
                payload: originalExercise,
            },
        ]);

        const inserted = await db.getFirstAsync<{
            id: string;
            name: string;
            is_active: number;
        }>(
            `SELECT id, name, is_active
     FROM catalog_exercises
     WHERE id = ?`,
            exerciseId
        );

        expect(inserted).toEqual({
            id: exerciseId,
            name: "Bench Press",
            is_active: 1,
        });

        expect(await getCatalogSyncVersion()).toBe(1);

        // Version 2: update the existing exercise.
        await applyCatalogChanges([
            {
                version: 2,
                entity_type: "exercises",
                entity_id: exerciseId,
                operation: "upsert",
                payload: {
                    ...originalExercise,
                    name: "Barbell Bench Press",
                    is_active: false,
                },
            },
        ]);

        const updated = await db.getFirstAsync<{
            name: string;
            is_active: number;
        }>(
            `SELECT name, is_active
     FROM catalog_exercises
     WHERE id = ?`,
            exerciseId
        );

        expect(updated).toEqual({
            name: "Barbell Bench Press",
            is_active: 0,
        });

        const countAfterUpdate = await db.getFirstAsync<{
            total: number;
        }>(
            `SELECT COUNT(*) AS total
     FROM catalog_exercises
     WHERE id = ?`,
            exerciseId
        );

        expect(countAfterUpdate?.total).toBe(1);
        expect(await getCatalogSyncVersion()).toBe(2);

        // Version 3: delete the exercise.
        await applyCatalogChanges([
            {
                version: 3,
                entity_type: "exercises",
                entity_id: exerciseId,
                operation: "delete",
                payload: null,
            },
        ]);

        const deleted = await db.getFirstAsync<{
            id: string;
        }>(
            `SELECT id
     FROM catalog_exercises
     WHERE id = ?`,
            exerciseId
        );

        expect(deleted).toBeNull();
        expect(await getCatalogSyncVersion()).toBe(3);
    });

    it("checks exercise-muscle relations when an exercise is deleted", async () => {
        // Version 1: create a muscle region.
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-upper",
                operation: "upsert",
                payload: {
                    id: "region-upper",
                    name: "Upper Body",
                },
            },
        ]);

        // Version 2: create a muscle.
        await applyCatalogChanges([
            {
                version: 2,
                entity_type: "muscles",
                entity_id: "muscle-chest",
                operation: "upsert",
                payload: {
                    id: "muscle-chest",
                    name: "Chest",
                    region_id: "region-upper",
                },
            },
        ]);

        // Version 3: create an exercise.
        await applyCatalogChanges([
            {
                version: 3,
                entity_type: "exercises",
                entity_id: "exercise-bench",
                operation: "upsert",
                payload: {
                    id: "exercise-bench",
                    name: "Bench Press",
                    is_active: true,
                },
            },
        ]);

        // Version 4: associate the exercise with the muscle.
        await applyCatalogChanges([
            {
                version: 4,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "upsert",
                payload: {
                    id: "relation-1",
                    exercise_id: "exercise-bench",
                    muscle_id: "muscle-chest",
                    role: "primary",
                },
            },
        ]);

        const relationBefore = await db.getFirstAsync<{
            exercise_id: string;
            muscle_id: string;
        }>(
            `SELECT exercise_id, muscle_id
     FROM catalog_exercise_muscles
     WHERE id = ?`,
            "relation-1"
        );

        expect(relationBefore).toEqual({
            exercise_id: "exercise-bench",
            muscle_id: "muscle-chest",
        });

        // Version 5: delete the exercise.
        await applyCatalogChanges([
            {
                version: 5,
                entity_type: "exercises",
                entity_id: "exercise-bench",
                operation: "delete",
                payload: null,
            },
        ]);

        const exerciseAfter = await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalog_exercises WHERE id = ?",
            "exercise-bench"
        );

        const relationAfter = await db.getFirstAsync<{
            id: string;
            exercise_id: string;
        }>("SELECT id, exercise_id FROM catalog_exercise_muscles WHERE id = ?", "relation-1");

        expect(exerciseAfter).toBeNull();

        // Current schema has no foreign key or cascading delete.
        expect(relationAfter).toEqual({
            id: "relation-1",
            exercise_id: "exercise-bench",
        });

        expect(await getCatalogSyncVersion()).toBe(5);
    });

    it("cleans up exercise relations when cascade delete events arrive", async () => {
        // Initial catalog: muscle, exercise and their relation.
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "muscles",
                entity_id: "muscle-1",
                operation: "upsert",
                payload: {
                    id: "muscle-1",
                    name: "Chest",
                },
            },
            {
                version: 2,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "upsert",
                payload: {
                    id: "exercise-1",
                    name: "Bench Press",
                    is_active: true,
                },
            },
            {
                version: 3,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "upsert",
                payload: {
                    id: "relation-1",
                    exercise_id: "exercise-1",
                    muscle_id: "muscle-1",
                    role: "primary",
                },
            },
        ]);

        // Supabase deletes the exercise first.
        await applyCatalogChanges([
            {
                version: 4,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "delete",
                payload: null,
            },
        ]);

        // The relation temporarily remains in SQLite.
        const intermediateRelation = await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalog_exercise_muscles WHERE id = ?",
            "relation-1"
        );

        expect(intermediateRelation).not.toBeNull();
        expect(await getCatalogSyncVersion()).toBe(4);

        // Supabase's cascading deletion arrives next.
        await applyCatalogChanges([
            {
                version: 5,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "delete",
                payload: null,
            },
        ]);

        const exercise = await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalog_exercises WHERE id = ?",
            "exercise-1"
        );

        const relation = await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalog_exercise_muscles WHERE id = ?",
            "relation-1"
        );

        const muscle = await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalog_muscles WHERE id = ?",
            "muscle-1"
        );

        expect(exercise).toBeNull();
        expect(relation).toBeNull();

        // Deleting an exercise must not delete its muscle.
        expect(muscle).not.toBeNull();

        expect(await getCatalogSyncVersion()).toBe(5);
    });

    it("resumes a partial cascade deletion without losing the sync cursor", async () => {
        // Initial catalog.
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "muscles",
                entity_id: "muscle-1",
                operation: "upsert",
                payload: {
                    id: "muscle-1",
                    name: "Chest",
                },
            },
            {
                version: 2,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "upsert",
                payload: {
                    id: "exercise-1",
                    name: "Bench Press",
                    is_active: true,
                },
            },
            {
                version: 3,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "upsert",
                payload: {
                    id: "relation-1",
                    exercise_id: "exercise-1",
                    muscle_id: "muscle-1",
                    role: "primary",
                },
            },
        ]);

        expect(await getCatalogSyncVersion()).toBe(3);

        // First page: the exercise deletion is committed.
        await applyCatalogChanges([
            {
                version: 4,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "delete",
                payload: null,
            },
        ]);

        // Simulate an interruption before receiving version 5.
        expect(await getCatalogSyncVersion()).toBe(4);

        const pendingRelation = await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalog_exercise_muscles WHERE id = ?",
            "relation-1"
        );

        expect(pendingRelation).not.toBeNull();

        // The next sync resumes from version 4.
        await applyCatalogChanges([
            {
                version: 5,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "delete",
                payload: null,
            },
        ]);

        expect(await getCatalogSyncVersion()).toBe(5);

        const remainingRelations = await db.getAllAsync<{ id: string }>(
            "SELECT id FROM catalog_exercise_muscles"
        );

        expect(remainingRelations).toHaveLength(0);

        // Replaying the last event must be harmless.
        await applyCatalogChanges([
            {
                version: 5,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "delete",
                payload: null,
            },
        ]);

        expect(await getCatalogSyncVersion()).toBe(5);

        const remainingExercises = await db.getAllAsync<{ id: string }>(
            "SELECT id FROM catalog_exercises"
        );

        const remainingMuscles = await db.getAllAsync<{ id: string }>(
            "SELECT id FROM catalog_muscles"
        );

        expect(remainingExercises).toHaveLength(0);
        expect(remainingMuscles).toHaveLength(1);
    });

    it("rolls back the entire page when an entity type is invalid", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-valid",
                operation: "upsert",
                payload: {
                    id: "region-valid",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "unknown_entity",
                entity_id: "invalid-entity",
                operation: "upsert",
                payload: {
                    id: "invalid-entity",
                    name: "Invalid",
                },
            },
        ];

        await expect(applyCatalogChanges(changes as any)).rejects.toThrow();

        // Neither event should have been committed.
        expect(await getCatalogSyncVersion()).toBe(0);

        const regions = await getLocalMuscleRegions();

        expect(regions.some((region) => region.id === "region-valid")).toBe(false);
    });

    it("rolls back the entire page when an operation is invalid", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-valid",
                operation: "upsert",
                payload: {
                    id: "region-valid",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscle_regions",
                entity_id: "region-invalid",
                operation: "truncate",
                payload: null,
            },
        ];

        await expect(applyCatalogChanges(changes as any)).rejects.toThrow();

        // The complete page must be rolled back.
        expect(await getCatalogSyncVersion()).toBe(0);

        const regions = await getLocalMuscleRegions();

        expect(regions.some((region) => region.id === "region-valid")).toBe(false);

        expect(regions.some((region) => region.id === "region-invalid")).toBe(false);
    });

    it("rolls back the entire page when payload ID does not match entity ID", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-valid",
                operation: "upsert",
                payload: {
                    id: "region-valid",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscle_regions",
                entity_id: "region-expected",
                operation: "upsert",
                payload: {
                    id: "region-different",
                    name: "Lower Body",
                },
            },
        ];

        await expect(applyCatalogChanges(changes as any)).rejects.toThrow();

        // Neither the valid nor the invalid event may be committed.
        expect(await getCatalogSyncVersion()).toBe(0);

        const regions = await getLocalMuscleRegions();

        expect(regions.some((region) => region.id === "region-valid")).toBe(false);
        expect(regions.some((region) => region.id === "region-expected")).toBe(false);
        expect(regions.some((region) => region.id === "region-different")).toBe(false);
    });

    it("rolls back the entire page when is_active is not a boolean", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-valid",
                operation: "upsert",
                payload: {
                    id: "region-valid",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "exercises",
                entity_id: "exercise-invalid",
                operation: "upsert",
                payload: {
                    id: "exercise-invalid",
                    name: "Bench Press",
                    is_active: "false",
                },
            },
        ];

        await expect(applyCatalogChanges(changes as any)).rejects.toThrow();

        // No changes should be committed.
        expect(await getCatalogSyncVersion()).toBe(0);

        const regions = await getLocalMuscleRegions();

        expect(regions.some((region) => region.id === "region-valid")).toBe(false);

        const exercises = await getLocalExercisesByFilter({
            filterMode: "muscle",
            selectedIds: [],
        });

        expect(exercises.some((exercise) => exercise.id === "exercise-invalid")).toBe(false);
    });

    it("rolls back the entire page when an upsert has a null payload", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-valid",
                operation: "upsert",
                payload: {
                    id: "region-valid",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscle_regions",
                entity_id: "region-invalid",
                operation: "upsert",
                payload: null,
            },
        ];

        await expect(applyCatalogChanges(changes as any)).rejects.toThrow();

        // The cursor must remain unchanged.
        expect(await getCatalogSyncVersion()).toBe(0);

        // The first valid event must also be rolled back.
        const regions = await getLocalMuscleRegions();

        expect(regions.some((region) => region.id === "region-valid")).toBe(false);

        expect(regions.some((region) => region.id === "region-invalid")).toBe(false);
    });

    it("rolls back the entire page when a required payload field is missing", async () => {
        const changes = [
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-valid",
                operation: "upsert",
                payload: {
                    id: "region-valid",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscle_regions",
                entity_id: "region-missing-name",
                operation: "upsert",
                payload: {
                    id: "region-missing-name",
                    // Required field "name" is missing.
                },
            },
        ];

        await expect(applyCatalogChanges(changes as any)).rejects.toThrow();

        // The entire transaction must be rolled back.
        expect(await getCatalogSyncVersion()).toBe(0);

        const regions = await getLocalMuscleRegions();

        expect(regions.some((region) => region.id === "region-valid")).toBe(false);

        expect(regions.some((region) => region.id === "region-missing-name")).toBe(false);
    });

    it("exposes active exercises even before their muscle relations arrive", async () => {
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "upsert",
                payload: {
                    id: "exercise-1",
                    name: "Bench Press",
                    is_active: true,
                },
            },
        ]);

        const allExercises = await getLocalExercisesByFilter({
            filterMode: "muscle",
            selectedIds: [],
        });

        expect(allExercises.map((exercise) => exercise.id)).toEqual(["exercise-1"]);

        const chestExercises = await getLocalExercisesByFilter({
            filterMode: "muscle",
            selectedIds: ["muscle-1"],
        });

        expect(chestExercises).toEqual([]);
        expect(await getCatalogSyncVersion()).toBe(1);
    });

    it("hides inactive exercises from catalog filters", async () => {
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "upsert",
                payload: {
                    id: "exercise-1",
                    name: "Bench Press",
                    is_active: true,
                },
            },
            {
                version: 2,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "upsert",
                payload: {
                    id: "exercise-1",
                    name: "Bench Press",
                    is_active: false,
                },
            },
        ]);

        const exercises = await getLocalExercisesByFilter({
            filterMode: "muscle",
            selectedIds: [],
        });

        expect(exercises).toEqual([]);
        expect(await getCatalogSyncVersion()).toBe(2);

        const storedExercise = await db.getFirstAsync<{
            id: string;
            is_active: number;
        }>("SELECT id, is_active FROM catalog_exercises WHERE id = ?", "exercise-1");

        expect(storedExercise).toEqual({
            id: "exercise-1",
            is_active: 0,
        });
    });

    it("updates exercise filtering when its muscle relation arrives later", async () => {
        await applyCatalogChanges([
            {
                version: 1,
                entity_type: "muscle_regions",
                entity_id: "region-1",
                operation: "upsert",
                payload: {
                    id: "region-1",
                    name: "Upper Body",
                },
            },
            {
                version: 2,
                entity_type: "muscles",
                entity_id: "muscle-1",
                operation: "upsert",
                payload: {
                    id: "muscle-1",
                    name: "Chest",
                    region_id: "region-1",
                },
            },
            {
                version: 3,
                entity_type: "exercises",
                entity_id: "exercise-1",
                operation: "upsert",
                payload: {
                    id: "exercise-1",
                    name: "Bench Press",
                    is_active: true,
                },
            },
        ]);

        const beforeRelation = await getLocalExercisesByFilter({
            filterMode: "muscle",
            selectedIds: ["muscle-1"],
        });

        expect(beforeRelation).toEqual([]);

        await applyCatalogChanges([
            {
                version: 4,
                entity_type: "exercise_muscles",
                entity_id: "relation-1",
                operation: "upsert",
                payload: {
                    id: "relation-1",
                    exercise_id: "exercise-1",
                    muscle_id: "muscle-1",
                    role: "primary",
                },
            },
        ]);

        const byMuscle = await getLocalExercisesByFilter({
            filterMode: "muscle",
            selectedIds: ["muscle-1"],
        });

        const byRegion = await getLocalExercisesByFilter({
            filterMode: "region",
            selectedIds: ["region-1"],
        });

        expect(byMuscle.map((exercise) => exercise.id)).toEqual(["exercise-1"]);

        expect(byRegion.map((exercise) => exercise.id)).toEqual(["exercise-1"]);

        expect(await getCatalogSyncVersion()).toBe(4);
    });
});
