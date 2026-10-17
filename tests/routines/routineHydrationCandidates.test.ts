import { getLocalRoutineSyncMetadata } from "../../src/database/repositories/routineRepository";
import { getRoutines } from "../../src/services/routineService";
import { getRoutineHydrationCandidates } from "../../src/services/sync/routineHydrationService";
import { getRemoteRoutineVersion } from "../../src/services/sync/routineRemoteVersionService";

jest.mock("../../src/services/sync/routineRemoteVersionService", () => ({
    getRemoteRoutineVersion: jest.fn(),
}));

const mockGetRemoteVersion = jest.mocked(getRemoteRoutineVersion);

jest.mock("../../src/database/repositories/routineRepository", () => ({
    getLocalRoutineSyncMetadata: jest.fn(),
}));

jest.mock("../../src/services/routineService", () => ({
    getRoutines: jest.fn(),
}));

const mockGetRoutines = jest.mocked(getRoutines);
const mockGetMetadata = jest.mocked(getLocalRoutineSyncMetadata);

describe("Initial routine hydration candidates", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("selects remote routines missing from SQLite", async () => {
        mockGetRoutines.mockResolvedValue([{ id: "remote-1", name: "Remote routine" }] as Awaited<
            ReturnType<typeof getRoutines>
        >);

        mockGetMetadata.mockResolvedValue(null);

        await expect(getRoutineHydrationCandidates("user-1")).resolves.toEqual([
            { routineId: "remote-1", name: "Remote routine" },
        ]);

        expect(mockGetMetadata).toHaveBeenCalledWith({
            userId: "user-1",
            routineId: "remote-1",
        });
    });

    it.each([
        ["pending", false],
        ["conflict", false],
        ["pending", true],
    ] as const)(
        "skips an existing routine with status %s and deleted=%s",
        async (syncStatus, isDeleted) => {
            mockGetRoutines.mockResolvedValue([
                { id: "existing-1", name: "Existing routine" },
            ] as Awaited<ReturnType<typeof getRoutines>>);

            mockGetMetadata.mockResolvedValue({
                routineId: "existing-1",
                remoteVersion: 7,
                syncStatus,
                isDeleted,
            });

            await expect(getRoutineHydrationCandidates("user-1")).resolves.toEqual([]);
        }
    );

    it("rejects an empty user before accessing data", async () => {
        await expect(getRoutineHydrationCandidates(" ")).rejects.toThrow("User ID is required.");

        expect(mockGetRoutines).not.toHaveBeenCalled();
        expect(mockGetMetadata).not.toHaveBeenCalled();
    });
    it.each([
        [6, false],
        [7, false],
        [8, true],
    ] as const)(
        "compares remote version %s against local version 7",
        async (remoteVersion, shouldRefresh) => {
            mockGetRoutines.mockResolvedValue([
                { id: "existing-1", name: "Existing routine" },
            ] as Awaited<ReturnType<typeof getRoutines>>);

            mockGetMetadata.mockResolvedValue({
                routineId: "existing-1",
                remoteVersion: 7,
                syncStatus: "synced",
                isDeleted: false,
            });

            mockGetRemoteVersion.mockResolvedValue({
                routineId: "existing-1",
                version: remoteVersion,
                isDeleted: false,
            });

            await expect(getRoutineHydrationCandidates("user-1")).resolves.toEqual(
                shouldRefresh ? [{ routineId: "existing-1", name: "Existing routine" }] : []
            );

            expect(mockGetRemoteVersion).toHaveBeenCalledWith({
                userId: "user-1",
                routineId: "existing-1",
            });
        }
    );
});
