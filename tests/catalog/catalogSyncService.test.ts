import { applyCatalogChanges, getCatalogSyncVersion } from "../../src/database/catalogRepository";
import { syncCatalog } from "../../src/services/catalogSyncService";
import { supabase } from "../../src/services/supabase";
import { notifyCatalogChanged } from "../../src/sync/catalogEvents";

jest.mock("../../src/database/catalogRepository", () => ({
    applyCatalogChanges: jest.fn(),
    getCatalogSyncVersion: jest.fn(),
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

const mockGetVersion = jest.mocked(getCatalogSyncVersion);
const mockApplyChanges = jest.mocked(applyCatalogChanges);
const mockGetUser = jest.mocked(supabase.auth.getUser);
const mockRpc = jest.mocked(supabase.rpc);
const mockNotify = jest.mocked(notifyCatalogChanged);

describe("Catalog synchronization", () => {
    beforeEach(() => {
        jest.resetAllMocks();

        mockGetUser.mockResolvedValue({
            data: { user: { id: "test-user" } },
            error: null,
        } as any);
    });

    it("does not download changes when the catalog is up to date", async () => {
        mockGetVersion.mockResolvedValue(40);

        mockRpc.mockResolvedValue({
            data: 40,
            error: null,
        } as any);

        const result = await syncCatalog();

        expect(result).toEqual({
            fromVersion: 40,
            toVersion: 40,
            changesApplied: 0,
            pagesDownloaded: 0,
        });

        expect(mockRpc).toHaveBeenCalledWith("get_catalog_version");
        expect(mockRpc).not.toHaveBeenCalledWith("get_catalog_changes", expect.anything());

        expect(mockApplyChanges).not.toHaveBeenCalled();
        expect(mockNotify).not.toHaveBeenCalled();
    });

    it("downloads and applies the initial catalog", async () => {
        let localVersion = 0;

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
        ];

        mockGetVersion.mockImplementation(async () => localVersion);

        mockRpc.mockImplementation((functionName) => {
            if (functionName === "get_catalog_version") {
                return Promise.resolve({
                    data: 3,
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

        mockApplyChanges.mockImplementation(async (page) => {
            localVersion = page[page.length - 1].version;
        });

        const result = await syncCatalog();

        expect(result).toEqual({
            fromVersion: 0,
            toVersion: 3,
            changesApplied: 3,
            pagesDownloaded: 1,
        });

        expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
            p_after_version: 0,
            p_limit: 200,
        });

        expect(mockApplyChanges).toHaveBeenCalledTimes(1);
        expect(mockApplyChanges).toHaveBeenCalledWith(changes);

        expect(mockNotify).toHaveBeenCalledTimes(1);
        expect(localVersion).toBe(3);
    });

    it("downloads multiple pages and advances the cursor correctly", async () => {
        let localVersion = 0;

        const totalChanges = 450;
        const pageSize = 200;

        const changes = Array.from({ length: totalChanges }, (_, index) => ({
            version: index + 1,
            entity_type: "muscle_regions" as const,
            entity_id: `region-${index + 1}`,
            operation: "upsert" as const,
            payload: {
                id: `region-${index + 1}`,
                name: `Region ${index + 1}`,
            },
        }));

        mockGetVersion.mockImplementation(async () => localVersion);

        mockRpc.mockImplementation((functionName, args) => {
            if (functionName === "get_catalog_version") {
                return Promise.resolve({
                    data: totalChanges,
                    error: null,
                }) as any;
            }

            if (functionName === "get_catalog_changes") {
                const afterVersion = args.p_after_version as number;
                const limit = args.p_limit as number;

                const page = changes
                    .filter((change) => change.version > afterVersion)
                    .slice(0, limit);

                return Promise.resolve({
                    data: page,
                    error: null,
                }) as any;
            }

            throw new Error(`Unexpected RPC: ${functionName}`);
        });

        mockApplyChanges.mockImplementation(async (page) => {
            localVersion = page[page.length - 1].version;
        });

        const result = await syncCatalog();

        expect(result).toEqual({
            fromVersion: 0,
            toVersion: 450,
            changesApplied: 450,
            pagesDownloaded: 3,
        });

        expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
            p_after_version: 0,
            p_limit: pageSize,
        });

        expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
            p_after_version: 200,
            p_limit: pageSize,
        });

        expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
            p_after_version: 400,
            p_limit: pageSize,
        });

        expect(mockApplyChanges).toHaveBeenCalledTimes(3);
        expect(mockNotify).toHaveBeenCalledTimes(3);

        expect(mockApplyChanges.mock.calls.map(([page]) => page.length)).toEqual([200, 200, 50]);

        expect(localVersion).toBe(450);
    });

    it("resumes from the last committed cursor after a failed page", async () => {
        let localVersion = 0;
        let shouldFail = true;

        const changes = Array.from({ length: 450 }, (_, index) => ({
            version: index + 1,
            entity_type: "muscle_regions" as const,
            entity_id: `region-${index + 1}`,
            operation: "upsert" as const,
            payload: {
                id: `region-${index + 1}`,
                name: `Region ${index + 1}`,
            },
        }));

        mockGetVersion.mockImplementation(async () => localVersion);

        mockRpc.mockImplementation((functionName, args) => {
            if (functionName === "get_catalog_version") {
                return Promise.resolve({
                    data: 450,
                    error: null,
                }) as any;
            }

            if (functionName === "get_catalog_changes") {
                const afterVersion = args.p_after_version as number;
                const limit = args.p_limit as number;

                if (shouldFail && afterVersion === 200) {
                    return Promise.resolve({
                        data: null,
                        error: new Error("Simulated network failure"),
                    }) as any;
                }

                const page = changes
                    .filter((change) => change.version > afterVersion)
                    .slice(0, limit);

                return Promise.resolve({
                    data: page,
                    error: null,
                }) as any;
            }

            throw new Error(`Unexpected RPC: ${functionName}`);
        });

        mockApplyChanges.mockImplementation(async (page) => {
            localVersion = page[page.length - 1].version;
        });

        // First attempt: the first page succeeds, the second fails.
        await expect(syncCatalog()).rejects.toThrow("Simulated network failure");

        expect(localVersion).toBe(200);
        expect(mockApplyChanges).toHaveBeenCalledTimes(1);
        expect(mockNotify).toHaveBeenCalledTimes(1);

        // Second attempt: the network is restored.
        shouldFail = false;

        const result = await syncCatalog();

        expect(result).toEqual({
            fromVersion: 200,
            toVersion: 450,
            changesApplied: 250,
            pagesDownloaded: 2,
        });

        expect(mockApplyChanges).toHaveBeenCalledTimes(3);
        expect(mockNotify).toHaveBeenCalledTimes(3);

        const appliedVersions = mockApplyChanges.mock.calls.flatMap(([page]) =>
            page.map((change) => change.version)
        );

        expect(appliedVersions).toHaveLength(450);
        expect(new Set(appliedVersions).size).toBe(450);

        expect(localVersion).toBe(450);
    });

    it("does not advance the cursor or notify when applying a page fails", async () => {
        let localVersion = 0;
        let failSecondPage = true;

        const changes = Array.from({ length: 250 }, (_, index) => ({
            version: index + 1,
            entity_type: "muscle_regions" as const,
            entity_id: `region-${index + 1}`,
            operation: "upsert" as const,
            payload: {
                id: `region-${index + 1}`,
                name: `Region ${index + 1}`,
            },
        }));

        mockGetVersion.mockImplementation(async () => localVersion);

        mockRpc.mockImplementation((functionName, args) => {
            if (functionName === "get_catalog_version") {
                return Promise.resolve({
                    data: 250,
                    error: null,
                }) as any;
            }

            if (functionName === "get_catalog_changes") {
                const afterVersion = args.p_after_version as number;
                const limit = args.p_limit as number;

                return Promise.resolve({
                    data: changes.filter((change) => change.version > afterVersion).slice(0, limit),
                    error: null,
                }) as any;
            }

            throw new Error(`Unexpected RPC: ${functionName}`);
        });

        mockApplyChanges.mockImplementation(async (page) => {
            if (failSecondPage && page[0].version === 201) {
                throw new Error("Simulated SQLite write failure");
            }

            localVersion = page[page.length - 1].version;
        });

        // First attempt: page 1 succeeds, page 2 fails.
        await expect(syncCatalog()).rejects.toThrow("Simulated SQLite write failure");

        expect(localVersion).toBe(200);
        expect(mockApplyChanges).toHaveBeenCalledTimes(2);
        expect(mockNotify).toHaveBeenCalledTimes(1);

        // Retry after the simulated storage failure is resolved.
        failSecondPage = false;

        const result = await syncCatalog();

        expect(result).toEqual({
            fromVersion: 200,
            toVersion: 250,
            changesApplied: 50,
            pagesDownloaded: 1,
        });

        expect(mockApplyChanges).toHaveBeenCalledTimes(3);
        expect(mockNotify).toHaveBeenCalledTimes(2);

        // The failed page must be retried from its original cursor.
        expect(mockRpc).toHaveBeenLastCalledWith("get_catalog_changes", {
            p_after_version: 200,
            p_limit: 200,
        });

        expect(localVersion).toBe(250);
    });

    describe("Catalog change integrity", () => {
        const makeChange = (version: number) => ({
            version,
            entity_type: "muscle_regions" as const,
            entity_id: `region-${version}`,
            operation: "upsert" as const,
            payload: {
                id: `region-${version}`,
                name: `Region ${version}`,
            },
        });

        async function prepareSync(
            remoteVersion: number,
            changes: ReturnType<typeof makeChange>[]
        ) {
            mockGetVersion.mockResolvedValue(0);

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: remoteVersion,
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
        }

        it("rejects a gap in change versions", async () => {
            await prepareSync(3, [makeChange(1), makeChange(3)]);

            await expect(syncCatalog()).rejects.toThrow(
                "Catalog change versions are not contiguous"
            );

            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("rejects duplicate change versions", async () => {
            await prepareSync(2, [makeChange(1), makeChange(1)]);

            await expect(syncCatalog()).rejects.toThrow(
                "Catalog change versions are not contiguous"
            );

            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("rejects an empty page before reaching the target", async () => {
            await prepareSync(5, []);

            await expect(syncCatalog()).rejects.toThrow(
                "Catalog sync stopped before reaching target version"
            );

            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("rejects an invalid remote catalog version", async () => {
            await prepareSync(-1, []);

            await expect(syncCatalog()).rejects.toThrow("Invalid remote catalog version");

            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("rejects a local version ahead of the server", async () => {
            mockGetVersion.mockResolvedValue(50);

            mockRpc.mockImplementation(() => {
                return Promise.resolve({
                    data: 40,
                    error: null,
                }) as any;
            });

            await expect(syncCatalog()).rejects.toThrow(
                "Local catalog version is ahead of the server"
            );

            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("rejects a cursor that does not match the applied page", async () => {
            await prepareSync(2, [makeChange(1), makeChange(2)]);

            // Simulate a repository that reports success
            // without persisting the expected cursor.
            mockGetVersion.mockResolvedValue(0);
            mockApplyChanges.mockResolvedValue();

            await expect(syncCatalog()).rejects.toThrow("Catalog cursor did not advance correctly");

            expect(mockApplyChanges).toHaveBeenCalledTimes(1);
            expect(mockNotify).not.toHaveBeenCalled();
        });

        it("preserves changes published during a paginated sync for the next run", async () => {
            let localVersion = 0;
            let remoteVersion = 201;

            const changes = Array.from({ length: 201 }, (_, index) => ({
                version: index + 1,
                entity_type: "muscle_regions" as const,
                entity_id: `region-${index + 1}`,
                operation: "upsert" as const,
                payload: {
                    id: `region-${index + 1}`,
                    name: `Region ${index + 1}`,
                },
            }));

            mockGetVersion.mockImplementation(async () => localVersion);

            mockRpc.mockImplementation((functionName, args) => {
                if (functionName === "get_catalog_version") {
                    return Promise.resolve({
                        data: remoteVersion,
                        error: null,
                    }) as any;
                }

                if (functionName === "get_catalog_changes") {
                    const afterVersion = args.p_after_version as number;
                    const limit = args.p_limit as number;

                    const page = changes
                        .filter((change) => change.version > afterVersion)
                        .slice(0, limit);

                    return Promise.resolve({
                        data: page,
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            mockApplyChanges.mockImplementation(async (page) => {
                localVersion = page[page.length - 1].version;

                // A new change is published after the first page is applied.
                if (localVersion === 200 && remoteVersion === 201) {
                    remoteVersion = 202;

                    changes.push({
                        version: 202,
                        entity_type: "muscle_regions",
                        entity_id: "region-202",
                        operation: "upsert",
                        payload: {
                            id: "region-202",
                            name: "Region 202",
                        },
                    });
                }
            });

            // First sync captures target version 201.
            const firstResult = await syncCatalog();

            expect(firstResult).toEqual({
                fromVersion: 0,
                toVersion: 201,
                changesApplied: 201,
                pagesDownloaded: 2,
            });

            expect(localVersion).toBe(201);

            // The second page may contain version 202, but it must
            // not be applied beyond the captured target version.
            const firstRunVersions = mockApplyChanges.mock.calls.flatMap(([page]) =>
                page.map((change) => change.version)
            );

            expect(firstRunVersions).toHaveLength(201);
            expect(firstRunVersions).not.toContain(202);

            // Next sync discovers the newly published version.
            const secondResult = await syncCatalog();

            expect(secondResult).toEqual({
                fromVersion: 201,
                toVersion: 202,
                changesApplied: 1,
                pagesDownloaded: 1,
            });

            expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
                p_after_version: 201,
                p_limit: 200,
            });

            const allAppliedVersions = mockApplyChanges.mock.calls.flatMap(([page]) =>
                page.map((change) => change.version)
            );

            expect(allAppliedVersions).toHaveLength(202);
            expect(new Set(allAppliedVersions).size).toBe(202);

            expect(localVersion).toBe(202);
            expect(mockNotify).toHaveBeenCalledTimes(3);
        });

        it("shares one synchronization when called concurrently", async () => {
            let localVersion = 0;

            let releaseVersionRequest!: () => void;

            const versionRequestGate = new Promise<void>((resolve) => {
                releaseVersionRequest = resolve;
            });

            mockGetVersion.mockImplementation(async () => localVersion);

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    // Keep the first sync pending so a second caller
                    // can attempt to start another synchronization.
                    return versionRequestGate.then(() => ({
                        data: 1,
                        error: null,
                    })) as any;
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
                        ],
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            mockApplyChanges.mockImplementation(async (page) => {
                localVersion = page[page.length - 1].version;
            });

            // Two callers start synchronization at the same time.
            const firstSync = syncCatalog();
            const secondSync = syncCatalog();

            // Both callers must receive the same in-flight promise.
            expect(secondSync).toBe(firstSync);

            // Allow the shared synchronization to continue.
            releaseVersionRequest();

            const [firstResult, secondResult] = await Promise.all([firstSync, secondSync]);

            expect(firstResult).toEqual({
                fromVersion: 0,
                toVersion: 1,
                changesApplied: 1,
                pagesDownloaded: 1,
            });

            expect(secondResult).toEqual(firstResult);

            // Only one actual synchronization should have run.
            expect(mockGetUser).toHaveBeenCalledTimes(1);
            expect(mockGetVersion).toHaveBeenCalledTimes(2);

            expect(mockRpc).toHaveBeenCalledWith("get_catalog_version");
            expect(mockRpc).toHaveBeenCalledWith("get_catalog_changes", {
                p_after_version: 0,
                p_limit: 200,
            });

            expect(mockRpc).toHaveBeenCalledTimes(2);
            expect(mockApplyChanges).toHaveBeenCalledTimes(1);
            expect(mockNotify).toHaveBeenCalledTimes(1);

            expect(localVersion).toBe(1);
        });

        it("allows a new synchronization after a shared sync fails", async () => {
            let localVersion = 0;
            let shouldFail = true;

            let releaseVersionRequest!: () => void;

            const versionRequestGate = new Promise<void>((resolve) => {
                releaseVersionRequest = resolve;
            });

            mockGetVersion.mockImplementation(async () => localVersion);

            mockRpc.mockImplementation((functionName) => {
                if (functionName === "get_catalog_version") {
                    if (shouldFail) {
                        return versionRequestGate.then(() => ({
                            data: null,
                            error: new Error("Simulated network failure"),
                        })) as any;
                    }

                    return Promise.resolve({
                        data: 1,
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
                        ],
                        error: null,
                    }) as any;
                }

                throw new Error(`Unexpected RPC: ${functionName}`);
            });

            mockApplyChanges.mockImplementation(async (page) => {
                localVersion = page[page.length - 1].version;
            });

            // Two callers share the same failing synchronization.
            const firstSync = syncCatalog();
            const secondSync = syncCatalog();

            expect(secondSync).toBe(firstSync);

            releaseVersionRequest();

            const firstAttempt = await Promise.allSettled([firstSync, secondSync]);

            expect(firstAttempt).toHaveLength(2);

            for (const result of firstAttempt) {
                expect(result.status).toBe("rejected");

                if (result.status === "rejected") {
                    expect(result.reason.message).toBe("Simulated network failure");
                }
            }

            // The failed synchronization must not modify local data.
            expect(localVersion).toBe(0);
            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();

            // Restore connectivity.
            shouldFail = false;

            // A new call must create a fresh synchronization.
            const retrySync = syncCatalog();

            expect(retrySync).not.toBe(firstSync);

            const retryResult = await retrySync;

            expect(retryResult).toEqual({
                fromVersion: 0,
                toVersion: 1,
                changesApplied: 1,
                pagesDownloaded: 1,
            });

            expect(localVersion).toBe(1);

            // One failed attempt + one successful retry.
            expect(mockGetUser).toHaveBeenCalledTimes(2);
            expect(mockApplyChanges).toHaveBeenCalledTimes(1);
            expect(mockNotify).toHaveBeenCalledTimes(1);
        });

        it("rejects a change with an invalid version without modifying local data", async () => {
            let localVersion = 0;

            mockGetVersion.mockImplementation(async () => localVersion);

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

            mockApplyChanges.mockImplementation(async (page) => {
                localVersion = page[page.length - 1].version;
            });

            await expect(syncCatalog()).rejects.toThrow(
                "Catalog change versions are not contiguous"
            );

            expect(localVersion).toBe(0);
            expect(mockApplyChanges).not.toHaveBeenCalled();
            expect(mockNotify).not.toHaveBeenCalled();
        });
    });
});
