import { getCatalogSyncVersion, getLocalMuscleRegions } from "../../src/database/catalogRepository";
import { getDatabase } from "../../src/database/database";
import { runMigrations } from "../../src/database/migrations";
import { syncCatalog } from "../../src/services/catalogSyncService";
import { supabase } from "../../src/services/supabase";
import { notifyCatalogChanged } from "../../src/sync/catalogEvents";

import { createTestDatabase } from "./helpers/nodeSqliteAdapter";

// Mock only the external boundaries.
// Keep catalogSyncService and catalogRepository real.
jest.mock("../../src/database/database", () => ({
    getDatabase: jest.fn(),
}));

jest.mock("../../src/services/supabase", () => ({
    supabase: {
        auth: {
            getUser: jest.fn(),
        },
        rpc: jest.fn(),
    },
}));

jest.mock("../../src/sync/catalogEvents", () => ({
    notifyCatalogChanged: jest.fn(),
}));

const mockGetDatabase = jest.mocked(getDatabase);
const mockGetUser = jest.mocked(supabase.auth.getUser);
const mockRpc = jest.mocked(supabase.rpc);
const mockNotify = jest.mocked(notifyCatalogChanged);

describe("Catalog sync end-to-end integration", () => {
    it("downloads changes and persists them through the real repository", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            const changes = [
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
            ];

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 2,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    return Promise.resolve({
                        data: changes,
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            const result = await syncCatalog();

            expect(result).toEqual({
                fromVersion: 0,
                toVersion: 2,
                changesApplied: 2,
                pagesDownloaded: 1,
            });

            expect(await getCatalogSyncVersion()).toBe(2);

            expect(await getLocalMuscleRegions()).toEqual([
                { id: "region-2", name: "Lower Body" },
                { id: "region-1", name: "Upper Body" },
            ]);

            expect(mockNotify).toHaveBeenCalledTimes(1);

            // A second sync must not download the same changes.
            const secondResult = await syncCatalog();

            expect(secondResult).toEqual({
                fromVersion: 2,
                toVersion: 2,
                changesApplied: 0,
                pagesDownloaded: 0,
            });

            expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
                p_after_version: 0,
                p_limit: 200,
            });

            expect(
                mockRpc.mock.calls.filter(([name]) => name === "get_catalog_changes")
            ).toHaveLength(1);

            expect(mockNotify).toHaveBeenCalledTimes(1);
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("recovers from a real SQLite transaction failure on retry", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            let invalidPayload = true;

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 2,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    return Promise.resolve({
                        data: [
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
                                    name: invalidPayload ? null : "Lower Body",
                                },
                            },
                        ],
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            // First attempt: SQLite rejects the missing required name.
            await expect(syncCatalog()).rejects.toThrow();

            expect(await getCatalogSyncVersion()).toBe(0);
            expect(await getLocalMuscleRegions()).toEqual([]);
            expect(mockNotify).not.toHaveBeenCalled();

            // Simulate the server returning a corrected payload.
            invalidPayload = false;

            // Second attempt: the same versions can now be applied.
            const result = await syncCatalog();

            expect(result).toEqual({
                fromVersion: 0,
                toVersion: 2,
                changesApplied: 2,
                pagesDownloaded: 1,
            });

            expect(await getCatalogSyncVersion()).toBe(2);

            expect(await getLocalMuscleRegions()).toEqual([
                { id: "region-2", name: "Lower Body" },
                { id: "region-1", name: "Upper Body" },
            ]);

            expect(mockNotify).toHaveBeenCalledTimes(1);

            // Both attempts must have started from the original cursor.
            expect(mockRpc.mock.calls.filter(([name]) => name === "get_catalog_changes")).toEqual([
                ["get_catalog_changes", { p_after_version: 0, p_limit: 200 }],
                ["get_catalog_changes", { p_after_version: 0, p_limit: 200 }],
            ]);
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("resumes from the last committed page after a SQLite failure", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            let invalidLastChange = true;

            const changes = Array.from({ length: 201 }, (_, index) => ({
                version: index + 1,
                entity_type: "muscle_regions",
                entity_id: `region-${index + 1}`,
                operation: "upsert",
                payload: {
                    id: `region-${index + 1}`,
                    name: `Region ${index + 1}`,
                },
            }));

            mockRpc.mockImplementation((functionName, args) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 201,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    const afterVersion = args.p_after_version as number;
                    const limit = args.p_limit as number;

                    const page = changes
                        .filter((change) => change.version > afterVersion)
                        .slice(0, limit)
                        .map((change) => ({
                            ...change,
                            payload: {
                                ...change.payload,
                                name:
                                    change.version === 201 && invalidLastChange
                                        ? null
                                        : change.payload.name,
                            },
                        }));

                    return Promise.resolve({
                        data: page,
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            // First attempt: page 1 succeeds; page 2 fails.
            await expect(syncCatalog()).rejects.toThrow();

            expect(await getCatalogSyncVersion()).toBe(200);

            const regionsAfterFailure = await getLocalMuscleRegions();

            expect(regionsAfterFailure).toHaveLength(200);
            expect(regionsAfterFailure.some((region) => region.id === "region-201")).toBe(false);

            expect(mockNotify).toHaveBeenCalledTimes(1);

            // Simulate receiving a corrected final event.
            invalidLastChange = false;

            const result = await syncCatalog();

            expect(result).toEqual({
                fromVersion: 200,
                toVersion: 201,
                changesApplied: 1,
                pagesDownloaded: 1,
            });

            expect(await getCatalogSyncVersion()).toBe(201);

            const regionsAfterRetry = await getLocalMuscleRegions();

            expect(regionsAfterRetry).toHaveLength(201);
            expect(new Set(regionsAfterRetry.map((region) => region.id)).size).toBe(201);

            expect(mockNotify).toHaveBeenCalledTimes(2);

            // Verify that the failed page was retried from cursor 200.
            const requestedCursors = mockRpc.mock.calls
                .filter(([name]) => name === "get_catalog_changes")
                .map(([, args]) => args.p_after_version);

            expect(requestedCursors).toEqual([0, 200, 200]);
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("persists catalog updates and deletions across sync runs", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            const changes = [
                {
                    version: 1,
                    entity_type: "muscle_regions",
                    entity_id: "region-1",
                    operation: "upsert",
                    payload: {
                        id: "region-1",
                        name: "Original",
                    },
                },
                {
                    version: 2,
                    entity_type: "muscle_regions",
                    entity_id: "region-1",
                    operation: "upsert",
                    payload: {
                        id: "region-1",
                        name: "Updated",
                    },
                },
                {
                    version: 3,
                    entity_type: "muscle_regions",
                    entity_id: "region-1",
                    operation: "delete",
                    payload: null,
                },
            ];

            let remoteVersion = 1;

            mockRpc.mockImplementation((functionName, args) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: remoteVersion,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    return Promise.resolve({
                        data: changes.filter(
                            (change) =>
                                change.version > args.p_after_version &&
                                change.version <= remoteVersion
                        ),
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            // Create.
            await syncCatalog();

            expect(await getCatalogSyncVersion()).toBe(1);
            expect(await getLocalMuscleRegions()).toEqual([{ id: "region-1", name: "Original" }]);

            // Update.
            remoteVersion = 2;
            await syncCatalog();

            expect(await getCatalogSyncVersion()).toBe(2);
            expect(await getLocalMuscleRegions()).toEqual([{ id: "region-1", name: "Updated" }]);

            // Delete.
            remoteVersion = 3;
            await syncCatalog();

            expect(await getCatalogSyncVersion()).toBe(3);
            expect(await getLocalMuscleRegions()).toEqual([]);

            expect(mockNotify).toHaveBeenCalledTimes(3);
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("rejects malformed versions before writing to SQLite", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 2,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    return Promise.resolve({
                        data: [
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
                                version: Number.NaN,
                                entity_type: "muscle_regions",
                                entity_id: "region-2",
                                operation: "upsert",
                                payload: {
                                    id: "region-2",
                                    name: "Lower Body",
                                },
                            },
                        ],
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            await expect(syncCatalog()).rejects.toThrow(
                "Catalog change versions are not contiguous"
            );

            expect(await getCatalogSyncVersion()).toBe(0);
            expect(await getLocalMuscleRegions()).toEqual([]);
            expect(mockNotify).not.toHaveBeenCalled();
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("synchronizes an exercise and its muscle relationship", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            const changes = [
                {
                    version: 1,
                    entity_type: "muscle_regions",
                    entity_id: "region-1",
                    operation: "upsert",
                    payload: { id: "region-1", name: "Upper Body" },
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
            ];

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 4,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    return Promise.resolve({
                        data: changes,
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            const result = await syncCatalog();

            expect(result.toVersion).toBe(4);
            expect(result.changesApplied).toBe(4);

            const exercise = await db.getFirstAsync<{
                id: string;
                name: string;
            }>("SELECT id, name FROM catalog_exercises WHERE id = ?", "exercise-1");

            expect(exercise).toEqual({
                id: "exercise-1",
                name: "Bench Press",
            });

            const relation = await db.getFirstAsync<{
                exercise_id: string;
                muscle_id: string;
            }>(
                `SELECT exercise_id, muscle_id
             FROM catalog_exercise_muscles
             WHERE id = ?`,
                "relation-1"
            );

            expect(relation).toEqual({
                exercise_id: "exercise-1",
                muscle_id: "muscle-1",
            });

            expect(await getCatalogSyncVersion()).toBe(4);
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("removes an exercise and its relationship through cascade events", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            const changes = [
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
                {
                    version: 3,
                    entity_type: "exercises",
                    entity_id: "exercise-1",
                    operation: "delete",
                    payload: null,
                },
                {
                    version: 4,
                    entity_type: "exercise_muscles",
                    entity_id: "relation-1",
                    operation: "delete",
                    payload: null,
                },
            ];

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 4,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    return Promise.resolve({
                        data: changes,
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            await syncCatalog();

            const exercise = await db.getFirstAsync(
                "SELECT id FROM catalog_exercises WHERE id = ?",
                "exercise-1"
            );

            const relation = await db.getFirstAsync(
                "SELECT id FROM catalog_exercise_muscles WHERE id = ?",
                "relation-1"
            );

            expect(exercise).toBeNull();
            expect(relation).toBeNull();
            expect(await getCatalogSyncVersion()).toBe(4);
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });

    it("resumes safely between exercise and relationship delete events", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            mockGetUser.mockResolvedValue({
                data: { user: { id: "test-user" } },
                error: null,
            } as any);

            const changes = [
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
                {
                    version: 3,
                    entity_type: "exercises",
                    entity_id: "exercise-1",
                    operation: "delete",
                    payload: null,
                },
                {
                    version: 4,
                    entity_type: "exercise_muscles",
                    entity_id: "relation-1",
                    operation: "delete",
                    payload: null,
                },
            ];

            let failLastPage = true;

            mockRpc.mockImplementation((functionName, args) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: 4,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    const afterVersion = args.p_after_version as number;

                    if (afterVersion === 3 && failLastPage) {
                        return Promise.resolve({
                            data: null,
                            error: new Error("Simulated network interruption"),
                        }) as any;
                    }

                    return Promise.resolve({
                        data: changes
                            .filter((change) => change.version > afterVersion)
                            .slice(0, afterVersion === 0 ? 3 : 200),
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            await expect(syncCatalog()).rejects.toThrow("Simulated network interruption");

            expect(await getCatalogSyncVersion()).toBe(3);

            const orphan = await db.getFirstAsync(
                "SELECT id FROM catalog_exercise_muscles WHERE id = ?",
                "relation-1"
            );

            expect(orphan).not.toBeNull();

            failLastPage = false;

            const result = await syncCatalog();

            expect(result).toEqual({
                fromVersion: 3,
                toVersion: 4,
                changesApplied: 1,
                pagesDownloaded: 1,
            });

            expect(await getCatalogSyncVersion()).toBe(4);

            const relation = await db.getFirstAsync(
                "SELECT id FROM catalog_exercise_muscles WHERE id = ?",
                "relation-1"
            );

            expect(relation).toBeNull();
        } finally {
            await db.closeAsync();
            jest.resetAllMocks();
        }
    });
});
