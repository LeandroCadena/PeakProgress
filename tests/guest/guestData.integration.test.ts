import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "../../src/database/database";
import { verifyDatabase } from "../../src/database/databaseDiagnostics";
import { attachGuestData, GUEST_USER_ID } from "../../src/database/guestAccount";
import { runMigrations } from "../../src/database/migrations";
import {
    getLocalPreference,
    updateLocalPreference,
} from "../../src/database/repositories/localPreferencesRepository";
import {
    completeLocalWorkout,
    createLocalWorkout,
    getLocalWorkoutHistory,
    readLocalWorkoutSnapshot,
} from "../../src/database/repositories/localWorkoutRepository";
import {
    getLocalRoutines,
    saveLocalRoutine,
} from "../../src/database/repositories/routineRepository";
import { getExercisesByFilter } from "../../src/services/exerciseService";
import { createTestDatabase } from "../catalog/helpers/nodeSqliteAdapter";

jest.mock("../../src/database/database", () => ({ getDatabase: jest.fn() }));
jest.mock("expo-crypto", () => ({ randomUUID: () => require("node:crypto").randomUUID() }));

it("opens a fresh database, uses the offline catalog and retains guest workouts on sign-in", async () => {
    const db = createTestDatabase();
    const sqlite = db as unknown as SQLiteDatabase;
    jest.mocked(getDatabase).mockResolvedValue(sqlite);

    try {
        await runMigrations(sqlite);
        await verifyDatabase();
        const catalog = await getExercisesByFilter({ filterMode: "muscle", selectedIds: [] });
        expect(catalog).toHaveLength(187);
        const exercise = catalog[0];
        const routineId = "routine";
        const routineExerciseId = "routine-exercise";
        await saveLocalRoutine({
            userId: GUEST_USER_ID,
            syncOperationId: "operation",
            createdLocally: true,
            snapshot: {
                routineId,
                name: "Training",
                exercises: [
                    {
                        id: routineExerciseId,
                        routine_id: routineId,
                        exercise_id: exercise.id,
                        position: 0,
                        rest_seconds: 90,
                        exercise_rest_seconds: 120,
                        exercise: { name: exercise.name },
                    },
                ],
                setsByExerciseId: {
                    [routineExerciseId]: [
                        {
                            id: "routine-set",
                            routine_exercise_id: routineExerciseId,
                            reps: 10,
                            weight: 20,
                            is_pr: false,
                            created_at: new Date().toISOString(),
                        },
                    ],
                },
            },
        });

        const session = await createLocalWorkout(GUEST_USER_ID, routineId);
        const active = await db.getFirstAsync<Parameters<typeof readLocalWorkoutSnapshot>[0]>(
            "SELECT * FROM local_workouts WHERE id = ?",
            session.id
        );
        expect(active).not.toBeNull();
        const { sessionExercises, savedSets } = readLocalWorkoutSnapshot(active!);
        savedSets[sessionExercises[0].id][0].is_completed = true;
        await completeLocalWorkout({
            userId: GUEST_USER_ID,
            sessionId: session.id,
            routineName: "Training",
            sessionExercises,
            savedSets,
            totalSets: 1,
            totalVolume: 200,
        });

        await updateLocalPreference("account", "weight", () => [{ id: "old" }]);
        await updateLocalPreference(GUEST_USER_ID, "weight", () => [{ id: "guest" }]);
        await attachGuestData("account");
        await attachGuestData("account");

        expect(await getLocalRoutines(GUEST_USER_ID)).toHaveLength(0);
        expect(await getLocalRoutines("account")).toHaveLength(1);
        expect(await getLocalWorkoutHistory(GUEST_USER_ID)).toHaveLength(0);
        expect(await getLocalWorkoutHistory("account")).toEqual([
            expect.objectContaining({ id: session.id, total_volume: 200 }),
        ]);
        expect(await getLocalPreference("account", "weight")).toEqual([
            { id: "guest" },
            { id: "old" },
        ]);
        expect(
            await db.getFirstAsync("SELECT user_id FROM sync_operations WHERE id = 'operation'")
        ).toEqual({ user_id: "account" });
    } finally {
        await db.closeAsync();
    }
});
