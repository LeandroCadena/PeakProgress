import {
    applyRemoteRoutineDeletion,
    getLocalRoutineSyncMetadata,
    getLocalRoutines,
} from "../../src/database/repositories/routineRepository";
import { syncRemoteRoutineDeletions } from "../../src/services/sync/routineRemoteDeletionService";
import { getRemoteRoutineVersion } from "../../src/services/sync/routineRemoteVersionService";

jest.mock("../../src/database/repositories/routineRepository", () => ({
    applyRemoteRoutineDeletion: jest.fn(),
    getLocalRoutineSyncMetadata: jest.fn(),
    getLocalRoutines: jest.fn(),
}));

jest.mock("../../src/services/sync/routineRemoteVersionService", () => ({
    getRemoteRoutineVersion: jest.fn(),
}));

const mockList = jest.mocked(getLocalRoutines);
const mockMetadata = jest.mocked(getLocalRoutineSyncMetadata);
const mockVersion = jest.mocked(getRemoteRoutineVersion);
const mockDelete = jest.mocked(applyRemoteRoutineDeletion);

describe("Remote routine deletions", () => {
    beforeEach(() => {
        jest.resetAllMocks();

        mockList.mockResolvedValue([
            {
                id: "routine-1",
                name: "Routine",
                created_at: "2026-10-17T00:00:00.000Z",
                updated_at: "2026-10-17T00:00:00.000Z",
            },
        ]);

        mockMetadata.mockResolvedValue({
            routineId: "routine-1",
            remoteVersion: 2,
            syncStatus: "synced",
            isDeleted: false,
        });
    });

    it("applies a confirmed remote deletion", async () => {
        mockVersion.mockResolvedValue({
            routineId: "routine-1",
            version: 3,
            isDeleted: true,
        });
        mockDelete.mockResolvedValue(true);

        await expect(syncRemoteRoutineDeletions("user-1")).resolves.toEqual({
            applied: 1,
            skipped: 0,
            failed: 0,
        });

        expect(mockDelete).toHaveBeenCalledWith({
            userId: "user-1",
            routineId: "routine-1",
            remoteVersion: 3,
        });
    });

    it("does not interpret a missing remote version as deletion", async () => {
        mockVersion.mockResolvedValue(null);

        await expect(syncRemoteRoutineDeletions("user-1")).resolves.toEqual({
            applied: 0,
            skipped: 1,
            failed: 0,
        });

        expect(mockDelete).not.toHaveBeenCalled();
    });

    it("skips pending local edits before querying Supabase", async () => {
        mockMetadata.mockResolvedValue({
            routineId: "routine-1",
            remoteVersion: 2,
            syncStatus: "pending",
            isDeleted: false,
        });

        await expect(syncRemoteRoutineDeletions("user-1")).resolves.toEqual({
            applied: 0,
            skipped: 1,
            failed: 0,
        });

        expect(mockVersion).not.toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();
    });
});
