import { getDatabase } from "../../src/database/database";
import { runMigrations } from "../../src/database/migrations";
import {
    getLocalRoutine,
    saveLocalRoutine,
} from "../../src/database/repositories/routineRepository";
import type { RoutineEditorSnapshot } from "../../src/store/routineEditorStore";
import { createTestDatabase } from "../catalog/helpers/nodeSqliteAdapter";

jest.mock("../../src/database/database", () => ({
    getDatabase: jest.fn(),
}));

const mockGetDatabase = jest.mocked(getDatabase);

describe("Routine save regression", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it("saves an edited routine without duplicating existing set IDs", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            const userId = "test-user";
            const routineId = "routine-1";
            const exerciseId = "routine-exercise-1";
            const setId = "routine-set-1";
            const createdAt = new Date().toISOString();

            const initialSnapshot: RoutineEditorSnapshot = {
                routineId,
                name: "test Routine2",
                exercises: [
                    {
                        id: exerciseId,
                        routine_id: routineId,
                        exercise_id: "catalog-exercise-1",
                        position: 0,
                        rest_seconds: 90,
                        exercise_rest_seconds: 120,
                        exercise: {
                            name: "Bench Press",
                            image_url: null,
                        },
                    },
                ],
                setsByExerciseId: {
                    [exerciseId]: [
                        {
                            id: setId,
                            routine_exercise_id: exerciseId,
                            reps: 10,
                            weight: 40,
                            is_pr: false,
                            created_at: createdAt,
                        },
                    ],
                },
            };

            await saveLocalRoutine({
                userId,
                snapshot: initialSnapshot,
                syncOperationId: "operation-1",
                createdLocally: true,
            });

            const secondExerciseId = "routine-exercise-2";

            const updatedSnapshot: RoutineEditorSnapshot = {
                ...initialSnapshot,
                exercises: [
                    ...initialSnapshot.exercises,
                    {
                        id: secondExerciseId,
                        routine_id: routineId,
                        exercise_id: "catalog-exercise-2",
                        position: 1,
                        rest_seconds: 90,
                        exercise_rest_seconds: 120,
                        exercise: {
                            name: "Squat",
                            image_url: null,
                        },
                    },
                ],
                setsByExerciseId: {
                    ...initialSnapshot.setsByExerciseId,
                    [secondExerciseId]: [
                        {
                            id: "routine-set-2",
                            routine_exercise_id: secondExerciseId,
                            reps: 12,
                            weight: 50,
                            is_pr: false,
                            created_at: createdAt,
                        },
                    ],
                },
            };

            await expect(
                saveLocalRoutine({
                    userId,
                    snapshot: updatedSnapshot,
                    syncOperationId: "operation-2",
                })
            ).resolves.toBeUndefined();

            const saved = await getLocalRoutine({
                userId,
                routineId,
            });

            expect(saved?.exercises).toHaveLength(2);
            expect(saved?.setsByExerciseId[exerciseId]).toHaveLength(1);
            expect(saved?.setsByExerciseId[secondExerciseId]).toHaveLength(1);

            const storedSets = await db.getAllAsync<{
                id: string;
                routine_exercise_id: string;
            }>(
                `SELECT id, routine_exercise_id
                 FROM local_routine_exercise_sets
                 ORDER BY id`
            );

            expect(storedSets).toEqual([
                {
                    id: "routine-set-1",
                    routine_exercise_id: exerciseId,
                },
                {
                    id: "routine-set-2",
                    routine_exercise_id: secondExerciseId,
                },
            ]);

            const operations = await db.getAllAsync<{
                payload: string;
            }>(
                `SELECT payload
                 FROM sync_operations
                 WHERE entity_type = 'routine'
                   AND entity_id = ?`,
                routineId
            );

            // The pending operation should be consolidated,
            // not duplicated.
            expect(operations).toHaveLength(1);

            const queuedSnapshot = JSON.parse(operations[0].payload) as RoutineEditorSnapshot;

            expect(queuedSnapshot.exercises).toHaveLength(2);
            expect(queuedSnapshot.setsByExerciseId[exerciseId][0].id).toBe(setId);
        } finally {
            await db.closeAsync();
        }
    });
});
