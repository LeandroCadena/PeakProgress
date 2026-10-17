import { hydrateLocalRoutine } from "../../src/database/repositories/routineRepository";
import { getVersionedRemoteRoutineSnapshot } from "../../src/services/sync/remoteRoutineSnapshotService";
import { getRoutineHydrationCandidates } from "../../src/services/sync/routineHydrationService";
import { hydrateMissingRemoteRoutines } from "../../src/services/sync/routineInitialHydrationService";
import type { RoutineEditorSnapshot } from "../../src/store/routineEditorStore";

jest.mock("../../src/database/repositories/routineRepository", () => ({
    hydrateLocalRoutine: jest.fn(),
}));

jest.mock("../../src/services/sync/remoteRoutineSnapshotService", () => ({
    getVersionedRemoteRoutineSnapshot: jest.fn(),
}));

jest.mock("../../src/services/sync/routineHydrationService", () => ({
    getRoutineHydrationCandidates: jest.fn(),
}));

const mockCandidates = jest.mocked(getRoutineHydrationCandidates);
const mockRemoteSnapshot = jest.mocked(getVersionedRemoteRoutineSnapshot);
const mockHydrate = jest.mocked(hydrateLocalRoutine);

function makeSnapshot(routineId: string): RoutineEditorSnapshot {
    return {
        routineId,
        name: routineId,
        exercises: [],
        setsByExerciseId: {},
    };
}

describe("Routine hydration orchestration", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("continues after download and SQLite failures", async () => {
        jest.spyOn(console, "warn").mockImplementation(() => {});

        mockCandidates.mockResolvedValue([
            { routineId: "download-fails", name: "Download failure" },
            { routineId: "sqlite-fails", name: "SQLite failure" },
            { routineId: "skipped", name: "Pending local edit" },
            { routineId: "successful", name: "Successful" },
        ]);

        mockRemoteSnapshot.mockImplementation(async ({ routineId }) => {
            if (routineId === "download-fails") {
                throw new Error("Network unavailable");
            }

            return {
                snapshot: makeSnapshot(routineId),
                remoteVersion: 8,
            };
        });

        mockHydrate.mockImplementation(async ({ snapshot }) => {
            if (snapshot.routineId === "sqlite-fails") {
                throw new Error("SQLite write failed");
            }

            return snapshot.routineId !== "skipped";
        });

        await expect(hydrateMissingRemoteRoutines("user-1")).resolves.toEqual({
            hydrated: 1,
            skipped: 1,
            failed: 2,
        });

        expect(mockCandidates).toHaveBeenCalledWith("user-1");
        expect(mockRemoteSnapshot).toHaveBeenCalledTimes(4);
        expect(mockHydrate).toHaveBeenCalledTimes(3);

        // La última rutina se procesa pese a los fallos anteriores.
        expect(mockRemoteSnapshot).toHaveBeenLastCalledWith({
            userId: "user-1",
            routineId: "successful",
        });

        expect(mockHydrate).toHaveBeenLastCalledWith({
            userId: "user-1",
            snapshot: makeSnapshot("successful"),
            remoteVersion: 8,
        });

        // Una descarga fallida nunca debe llegar a SQLite.
        expect(mockHydrate.mock.calls.map(([params]) => params.snapshot.routineId)).toEqual([
            "sqlite-fails",
            "skipped",
            "successful",
        ]);
    });

    it("does nothing when there are no candidates", async () => {
        mockCandidates.mockResolvedValue([]);

        await expect(hydrateMissingRemoteRoutines("user-1")).resolves.toEqual({
            hydrated: 0,
            skipped: 0,
            failed: 0,
        });

        expect(mockRemoteSnapshot).not.toHaveBeenCalled();
        expect(mockHydrate).not.toHaveBeenCalled();
    });

    it("rejects an empty user before accessing data", async () => {
        await expect(hydrateMissingRemoteRoutines(" ")).rejects.toThrow("User ID is required.");

        expect(mockCandidates).not.toHaveBeenCalled();
        expect(mockRemoteSnapshot).not.toHaveBeenCalled();
        expect(mockHydrate).not.toHaveBeenCalled();
    });
});
