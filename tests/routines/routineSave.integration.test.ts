import { getDatabase } from "../../src/database/database";
import { runMigrations } from "../../src/database/migrations";
import {
    applyRemoteRoutineDeletion,
    deleteLocalRoutine,
    getLocalRoutine,
    hydrateLocalRoutine,
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

            // Editar la serie existente conservando sus IDs.
            const editedSnapshot: RoutineEditorSnapshot = {
                ...updatedSnapshot,
                setsByExerciseId: {
                    ...updatedSnapshot.setsByExerciseId,
                    [exerciseId]: [
                        {
                            ...updatedSnapshot.setsByExerciseId[exerciseId][0],
                            reps: 8,
                            weight: 55,
                        },
                    ],
                },
            };

            await saveLocalRoutine({
                userId,
                snapshot: editedSnapshot,
                syncOperationId: "operation-3",
            });

            const edited = await getLocalRoutine({ userId, routineId });

            expect(edited?.exercises).toHaveLength(2);
            expect(edited?.setsByExerciseId[exerciseId]).toEqual([
                {
                    ...initialSnapshot.setsByExerciseId[exerciseId][0],
                    reps: 8,
                    weight: 55,
                },
            ]);

            // La otra serie debe permanecer intacta.
            expect(edited?.setsByExerciseId[secondExerciseId]).toEqual(
                updatedSnapshot.setsByExerciseId[secondExerciseId]
            );

            const editedStoredSets = await db.getAllAsync<{ id: string }>(
                "SELECT id FROM local_routine_exercise_sets ORDER BY id"
            );

            expect(editedStoredSets).toEqual([{ id: setId }, { id: "routine-set-2" }]);

            const editedOperations = await db.getAllAsync<{ payload: string }>(
                `SELECT payload
     FROM sync_operations
     WHERE entity_type = 'routine'
       AND entity_id = ?`,
                routineId
            );

            expect(editedOperations).toHaveLength(1);

            const editedPayload = JSON.parse(editedOperations[0].payload) as RoutineEditorSnapshot;

            expect(editedPayload).toEqual(editedSnapshot);

            // Eliminar el primer ejercicio y sus series.
            const reducedSnapshot: RoutineEditorSnapshot = {
                ...editedSnapshot,
                exercises: editedSnapshot.exercises
                    .filter((exercise) => exercise.id !== exerciseId)
                    .map((exercise, position) => ({
                        ...exercise,
                        position,
                    })),
                setsByExerciseId: {
                    [secondExerciseId]: editedSnapshot.setsByExerciseId[secondExerciseId],
                },
            };

            await saveLocalRoutine({
                userId,
                snapshot: reducedSnapshot,
                syncOperationId: "operation-4",
            });

            const reduced = await getLocalRoutine({ userId, routineId });

            expect(reduced).toEqual(reducedSnapshot);

            // Consultar las tablas directamente para detectar filas huérfanas.
            const remainingExercises = await db.getAllAsync<{
                id: string;
                position: number;
            }>(
                `SELECT id, position
     FROM local_routine_exercises
     WHERE routine_id = ?
     ORDER BY position`,
                routineId
            );

            expect(remainingExercises).toEqual([{ id: secondExerciseId, position: 0 }]);

            const remainingSets = await db.getAllAsync<{
                id: string;
                routine_exercise_id: string;
            }>(
                `SELECT id, routine_exercise_id
     FROM local_routine_exercise_sets
     ORDER BY id`
            );

            expect(remainingSets).toEqual([
                {
                    id: "routine-set-2",
                    routine_exercise_id: secondExerciseId,
                },
            ]);

            const reducedOperations = await db.getAllAsync<{ payload: string }>(
                `SELECT payload
     FROM sync_operations
     WHERE entity_type = 'routine'
       AND entity_id = ?`,
                routineId
            );

            expect(reducedOperations).toHaveLength(1);
            expect(JSON.parse(reducedOperations[0].payload)).toEqual(reducedSnapshot);

            // Capturar el estado completo antes del fallo.
            const beforeRoutine = await getLocalRoutine({ userId, routineId });

            const beforeMetadata = await db.getAllAsync(
                "SELECT * FROM local_routines WHERE id = ?",
                routineId
            );

            const beforeExercises = await db.getAllAsync(
                `SELECT * FROM local_routine_exercises
     WHERE routine_id = ? ORDER BY id`,
                routineId
            );

            const beforeSets = await db.getAllAsync(
                "SELECT * FROM local_routine_exercise_sets ORDER BY id"
            );

            const beforeQueue = await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id");

            // Forzar un error real de SQLite al reinsertar las series.
            // Para entonces ya se intentaron actualizar la rutina y la cola.
            await db.execAsync(`
    CREATE TRIGGER fail_routine_set_insert
    BEFORE INSERT ON local_routine_exercise_sets
    BEGIN
        SELECT RAISE(ABORT, 'forced set insert failure');
    END;
`);

            try {
                const failingSnapshot: RoutineEditorSnapshot = {
                    ...reducedSnapshot,
                    name: "This change must roll back",
                    setsByExerciseId: {
                        [secondExerciseId]: reducedSnapshot.setsByExerciseId[secondExerciseId].map(
                            (set) => ({
                                ...set,
                                reps: 99,
                                weight: 999,
                            })
                        ),
                    },
                };

                await expect(
                    saveLocalRoutine({
                        userId,
                        snapshot: failingSnapshot,
                        syncOperationId: "operation-5",
                    })
                ).rejects.toThrow("forced set insert failure");
            } finally {
                await db.execAsync("DROP TRIGGER fail_routine_set_insert");
            }

            // Nada del guardado fallido debe persistir.
            expect(await getLocalRoutine({ userId, routineId })).toEqual(beforeRoutine);

            expect(
                await db.getAllAsync("SELECT * FROM local_routines WHERE id = ?", routineId)
            ).toEqual(beforeMetadata);

            expect(
                await db.getAllAsync(
                    `SELECT * FROM local_routine_exercises
         WHERE routine_id = ? ORDER BY id`,
                    routineId
                )
            ).toEqual(beforeExercises);

            expect(
                await db.getAllAsync("SELECT * FROM local_routine_exercise_sets ORDER BY id")
            ).toEqual(beforeSets);

            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                beforeQueue
            );

            const otherExerciseId = "other-routine-exercise";

            const otherSnapshot: RoutineEditorSnapshot = {
                routineId: "other-routine",
                name: "Unaffected routine",
                exercises: [
                    {
                        ...initialSnapshot.exercises[0],
                        id: otherExerciseId,
                        routine_id: "other-routine",
                    },
                ],
                setsByExerciseId: {
                    [otherExerciseId]: [
                        {
                            ...initialSnapshot.setsByExerciseId[exerciseId][0],
                            id: "other-routine-set",
                            routine_exercise_id: otherExerciseId,
                        },
                    ],
                },
            };

            await saveLocalRoutine({
                userId,
                snapshot: otherSnapshot,
                syncOperationId: "other-operation",
                createdLocally: true,
            });

            const otherQueueBefore = await db.getAllAsync(
                `SELECT * FROM sync_operations
     WHERE entity_type = 'routine' AND entity_id = ?
     ORDER BY id`,
                otherSnapshot.routineId
            );

            // Vaciar la primera rutina.
            const emptySnapshot: RoutineEditorSnapshot = {
                ...reducedSnapshot,
                exercises: [],
                setsByExerciseId: {},
            };

            await saveLocalRoutine({
                userId,
                snapshot: emptySnapshot,
                syncOperationId: "operation-6",
            });

            expect(await getLocalRoutine({ userId, routineId })).toEqual(emptySnapshot);

            expect(
                await getLocalRoutine({
                    userId,
                    routineId: otherSnapshot.routineId,
                })
            ).toEqual(otherSnapshot);

            // Solo debe permanecer la serie de la otra rutina.
            expect(
                await db.getAllAsync<{ id: string }>(
                    "SELECT id FROM local_routine_exercise_sets ORDER BY id"
                )
            ).toEqual([{ id: "other-routine-set" }]);

            expect(
                await db.getAllAsync(
                    `SELECT * FROM sync_operations
         WHERE entity_type = 'routine' AND entity_id = ?
         ORDER BY id`,
                    otherSnapshot.routineId
                )
            ).toEqual(otherQueueBefore);

            const emptyQueue = await db.getAllAsync<{ payload: string }>(
                `SELECT payload FROM sync_operations
     WHERE entity_type = 'routine' AND entity_id = ?`,
                routineId
            );

            expect(emptyQueue).toHaveLength(1);
            expect(JSON.parse(emptyQueue[0].payload)).toEqual(emptySnapshot);
        } finally {
            await db.closeAsync();
        }
    });

    it("hydrates a remote routine without creating an outgoing operation", async () => {
        const db = createTestDatabase();

        try {
            await runMigrations(db as any);
            mockGetDatabase.mockResolvedValue(db as any);

            const userId = "hydration-user";
            const routineId = "remote-routine";
            const exerciseId = "remote-routine-exercise";

            const snapshot: RoutineEditorSnapshot = {
                routineId,
                name: "Remote routine",
                exercises: [
                    {
                        id: exerciseId,
                        routine_id: routineId,
                        exercise_id: "catalog-exercise-1",
                        position: 0,
                        rest_seconds: 75,
                        exercise_rest_seconds: 150,
                        exercise: {
                            name: "Bench Press",
                            image_url: null,
                        },
                    },
                ],
                setsByExerciseId: {
                    [exerciseId]: [
                        {
                            id: "remote-set-1",
                            routine_exercise_id: exerciseId,
                            reps: 8,
                            weight: 60,
                            is_pr: false,
                            created_at: "2026-10-17T00:00:00.000Z",
                        },
                        {
                            id: "remote-set-2",
                            routine_exercise_id: exerciseId,
                            reps: 6,
                            weight: 65,
                            is_pr: true,
                            created_at: "2026-10-17T00:01:00.000Z",
                        },
                    ],
                },
            };

            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot,
                    remoteVersion: 7,
                })
            ).resolves.toBe(true);

            expect(await getLocalRoutine({ userId, routineId })).toEqual(snapshot);

            const metadata = await db.getFirstAsync<{
                sync_status: string;
                remote_state: string;
                remote_version: number;
            }>(
                `SELECT sync_status, remote_state, remote_version
             FROM local_routines WHERE id = ?`,
                routineId
            );

            expect(metadata).toEqual({
                sync_status: "synced",
                remote_state: "exists",
                remote_version: 7,
            });

            expect(await db.getAllAsync("SELECT * FROM sync_operations")).toEqual([]);

            // Repetir la hidratación debe conservar los IDs,
            // sin duplicar ejercicios ni series.
            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot,
                    remoteVersion: 7,
                })
            ).resolves.toBe(true);

            expect(await getLocalRoutine({ userId, routineId })).toEqual(snapshot);

            expect(await db.getAllAsync("SELECT id FROM local_routine_exercises")).toEqual([
                { id: exerciseId },
            ]);

            expect(
                await db.getAllAsync("SELECT id FROM local_routine_exercise_sets ORDER BY id")
            ).toEqual([{ id: "remote-set-1" }, { id: "remote-set-2" }]);

            expect(await db.getAllAsync("SELECT * FROM sync_operations")).toEqual([]);

            // Editar localmente una rutina previamente hidratada.
            const pendingSnapshot: RoutineEditorSnapshot = {
                ...snapshot,
                name: "Local pending edit",
                setsByExerciseId: {
                    [exerciseId]: snapshot.setsByExerciseId[exerciseId].map((set) => ({
                        ...set,
                        weight: set.weight + 5,
                    })),
                },
            };

            await saveLocalRoutine({
                userId,
                snapshot: pendingSnapshot,
                syncOperationId: "pending-hydrated-routine-edit",
            });

            const pendingMetadataBefore = await db.getFirstAsync(
                "SELECT * FROM local_routines WHERE id = ?",
                routineId
            );

            const pendingQueueBefore = await db.getAllAsync(
                `SELECT * FROM sync_operations
     WHERE entity_type = 'routine'
       AND entity_id = ?
     ORDER BY id`,
                routineId
            );

            expect(pendingQueueBefore).toHaveLength(1);

            // Simular un snapshot remoto más reciente y diferente.
            const newerRemoteSnapshot: RoutineEditorSnapshot = {
                ...snapshot,
                name: "Remote competing edit",
                setsByExerciseId: {
                    [exerciseId]: snapshot.setsByExerciseId[exerciseId].map((set) => ({
                        ...set,
                        reps: 20,
                        weight: 10,
                    })),
                },
            };

            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot: newerRemoteSnapshot,
                    remoteVersion: 8,
                })
            ).resolves.toBe(false);

            // La edición local y su versión base deben permanecer intactas.
            expect(await getLocalRoutine({ userId, routineId })).toEqual(pendingSnapshot);

            expect(
                await db.getFirstAsync("SELECT * FROM local_routines WHERE id = ?", routineId)
            ).toEqual(pendingMetadataBefore);

            expect(
                await db.getAllAsync(
                    `SELECT * FROM sync_operations
         WHERE entity_type = 'routine'
           AND entity_id = ?
         ORDER BY id`,
                    routineId
                )
            ).toEqual(pendingQueueBefore);

            await expect(
                deleteLocalRoutine({
                    userId,
                    routineId,
                    syncOperationId: "delete-hydrated-routine",
                })
            ).resolves.toBe(true);

            expect(await getLocalRoutine({ userId, routineId })).toBeNull();

            const deletedMetadataBefore = await db.getFirstAsync<{
                deleted_at: string | null;
                sync_status: string;
            }>(
                `SELECT deleted_at, sync_status
     FROM local_routines WHERE id = ?`,
                routineId
            );

            expect(deletedMetadataBefore).not.toBeNull();
            expect(deletedMetadataBefore?.deleted_at).not.toBeNull();
            expect(deletedMetadataBefore?.sync_status).toBe("pending");

            const deletedQueueBefore = await db.getAllAsync<{
                operation_type: string;
                [key: string]: unknown;
            }>(
                `SELECT * FROM sync_operations
     WHERE entity_type = 'routine'
       AND entity_id = ?
     ORDER BY id`,
                routineId
            );

            expect(
                deletedQueueBefore.some((operation) => operation.operation_type === "delete")
            ).toBe(true);

            // Un snapshot remoto no debe resucitar la rutina.
            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot: newerRemoteSnapshot,
                    remoteVersion: 9,
                })
            ).resolves.toBe(false);

            expect(await getLocalRoutine({ userId, routineId })).toBeNull();

            expect(
                await db.getFirstAsync(
                    `SELECT deleted_at, sync_status
         FROM local_routines WHERE id = ?`,
                    routineId
                )
            ).toEqual(deletedMetadataBefore);

            expect(
                await db.getAllAsync(
                    `SELECT * FROM sync_operations
         WHERE entity_type = 'routine'
           AND entity_id = ?
         ORDER BY id`,
                    routineId
                )
            ).toEqual(deletedQueueBefore);

            const ownerRoutineBefore = await db.getAllAsync(
                "SELECT * FROM local_routines ORDER BY id"
            );

            const ownerExercisesBefore = await db.getAllAsync(
                "SELECT * FROM local_routine_exercises ORDER BY id"
            );

            const ownerSetsBefore = await db.getAllAsync(
                "SELECT * FROM local_routine_exercise_sets ORDER BY id"
            );

            const ownerQueueBefore = await db.getAllAsync(
                "SELECT * FROM sync_operations ORDER BY id"
            );

            await expect(
                hydrateLocalRoutine({
                    userId: "another-user",
                    snapshot: {
                        ...snapshot,
                        name: "Attempted overwrite by another user",
                    },
                    remoteVersion: 10,
                })
            ).rejects.toThrow("Routine belongs to another local user.");

            expect(
                await getLocalRoutine({
                    userId: "another-user",
                    routineId,
                })
            ).toBeNull();

            expect(await db.getAllAsync("SELECT * FROM local_routines ORDER BY id")).toEqual(
                ownerRoutineBefore
            );

            expect(
                await db.getAllAsync("SELECT * FROM local_routine_exercises ORDER BY id")
            ).toEqual(ownerExercisesBefore);

            expect(
                await db.getAllAsync("SELECT * FROM local_routine_exercise_sets ORDER BY id")
            ).toEqual(ownerSetsBefore);

            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            const failedRoutineId = "failed-hydration-routine";
            const failedExerciseId = "failed-hydration-exercise";

            const failedSnapshot: RoutineEditorSnapshot = {
                routineId: failedRoutineId,
                name: "Incomplete hydration",
                exercises: [
                    {
                        ...snapshot.exercises[0],
                        id: failedExerciseId,
                        routine_id: failedRoutineId,
                    },
                ],
                setsByExerciseId: {
                    [failedExerciseId]: [
                        {
                            ...snapshot.setsByExerciseId[exerciseId][0],
                            id: "failed-hydration-set",
                            routine_exercise_id: failedExerciseId,
                        },
                    ],
                },
            };

            await db.execAsync(`
    CREATE TRIGGER fail_hydration_set
    BEFORE INSERT ON local_routine_exercise_sets
    WHEN NEW.id = 'failed-hydration-set'
    BEGIN
        SELECT RAISE(ABORT, 'forced hydration failure');
    END;
`);

            try {
                await expect(
                    hydrateLocalRoutine({
                        userId,
                        snapshot: failedSnapshot,
                        remoteVersion: 1,
                    })
                ).rejects.toThrow("forced hydration failure");
            } finally {
                await db.execAsync("DROP TRIGGER fail_hydration_set");
            }

            // Ni la cabecera ni sus hijos deben sobrevivir al fallo.
            expect(
                await db.getFirstAsync(
                    "SELECT id FROM local_routines WHERE id = ?",
                    failedRoutineId
                )
            ).toBeNull();

            expect(
                await db.getAllAsync(
                    `SELECT id FROM local_routine_exercises
         WHERE routine_id = ?`,
                    failedRoutineId
                )
            ).toEqual([]);

            expect(
                await db.getAllAsync(
                    `SELECT id FROM local_routine_exercise_sets
         WHERE routine_exercise_id = ?`,
                    failedExerciseId
                )
            ).toEqual([]);

            // Los datos anteriores y la cola deben permanecer intactos.
            expect(await db.getAllAsync("SELECT * FROM local_routines ORDER BY id")).toEqual(
                ownerRoutineBefore
            );

            expect(
                await db.getAllAsync("SELECT * FROM local_routine_exercises ORDER BY id")
            ).toEqual(ownerExercisesBefore);

            expect(
                await db.getAllAsync("SELECT * FROM local_routine_exercise_sets ORDER BY id")
            ).toEqual(ownerSetsBefore);

            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            // Al desaparecer el fallo, el mismo snapshot debe poder recuperarse.
            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot: failedSnapshot,
                    remoteVersion: 1,
                })
            ).resolves.toBe(true);

            expect(
                await getLocalRoutine({
                    userId,
                    routineId: failedRoutineId,
                })
            ).toEqual(failedSnapshot);

            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            // failedSnapshot ya fue hidratado correctamente con versión 1.
            const beforeStaleHydration = await db.getFirstAsync(
                "SELECT * FROM local_routines WHERE id = ?",
                failedRoutineId
            );

            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot: {
                        ...failedSnapshot,
                        name: "Stale remote name",
                        exercises: [],
                        setsByExerciseId: {},
                    },
                    remoteVersion: 0,
                })
            ).resolves.toBe(false);

            expect(
                await getLocalRoutine({
                    userId,
                    routineId: failedRoutineId,
                })
            ).toEqual(failedSnapshot);

            expect(
                await db.getFirstAsync("SELECT * FROM local_routines WHERE id = ?", failedRoutineId)
            ).toEqual(beforeStaleHydration);

            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            // La rutina failedSnapshot está sincronizada con versión 1.
            const refreshedSnapshot: RoutineEditorSnapshot = {
                ...failedSnapshot,
                name: "Updated on another device",
                exercises: failedSnapshot.exercises.map((exercise) => ({
                    ...exercise,
                    rest_seconds: 45,
                    exercise_rest_seconds: 100,
                })),
                setsByExerciseId: {
                    [failedExerciseId]: [
                        {
                            ...failedSnapshot.setsByExerciseId[failedExerciseId][0],
                            reps: 12,
                            weight: 75,
                        },
                        {
                            ...failedSnapshot.setsByExerciseId[failedExerciseId][0],
                            id: "remote-added-set",
                            reps: 10,
                            weight: 80,
                            created_at: "2026-10-17T00:02:00.000Z",
                        },
                    ],
                },
            };

            await expect(
                hydrateLocalRoutine({
                    userId,
                    snapshot: refreshedSnapshot,
                    remoteVersion: 2,
                })
            ).resolves.toBe(true);

            expect(
                await getLocalRoutine({
                    userId,
                    routineId: failedRoutineId,
                })
            ).toEqual(refreshedSnapshot);

            expect(
                await db.getFirstAsync(
                    `SELECT remote_version, sync_status, remote_state
         FROM local_routines WHERE id = ?`,
                    failedRoutineId
                )
            ).toEqual({
                remote_version: 2,
                sync_status: "synced",
                remote_state: "exists",
            });

            expect(
                await db.getAllAsync<{ id: string }>(
                    `SELECT id FROM local_routine_exercise_sets
         WHERE routine_exercise_id = ?
         ORDER BY id`,
                    failedExerciseId
                )
            ).toEqual([{ id: "failed-hydration-set" }, { id: "remote-added-set" }]);

            // Descargar cambios no debe producir operaciones de subida.
            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            const beforeStaleSave = await db.getFirstAsync(
                "SELECT * FROM local_routines WHERE id = ?",
                failedRoutineId
            );

            const staleDraft: RoutineEditorSnapshot = {
                ...failedSnapshot,
                name: "Draft based on version 1",
            };

            await expect(
                saveLocalRoutine({
                    userId,
                    snapshot: staleDraft,
                    syncOperationId: "stale-editor-save",
                    expectedLocalRemoteVersion: 1,
                })
            ).rejects.toThrow("Routine changed since it was loaded. Reload it before saving.");

            // Debe conservarse la versión 2 descargada.
            expect(
                await getLocalRoutine({
                    userId,
                    routineId: failedRoutineId,
                })
            ).toEqual(refreshedSnapshot);

            expect(
                await db.getFirstAsync("SELECT * FROM local_routines WHERE id = ?", failedRoutineId)
            ).toEqual(beforeStaleSave);

            // El intento rechazado tampoco debe modificar la cola.
            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            // Una eliminación antigua no puede ocultar la versión local 2.
            await expect(
                applyRemoteRoutineDeletion({
                    userId,
                    routineId: failedRoutineId,
                    remoteVersion: 1,
                })
            ).resolves.toBe(false);

            expect(
                await getLocalRoutine({
                    userId,
                    routineId: failedRoutineId,
                })
            ).toEqual(refreshedSnapshot);

            // Una eliminación posterior sí debe ocultarla.
            await expect(
                applyRemoteRoutineDeletion({
                    userId,
                    routineId: failedRoutineId,
                    remoteVersion: 3,
                })
            ).resolves.toBe(true);

            expect(
                await getLocalRoutine({
                    userId,
                    routineId: failedRoutineId,
                })
            ).toBeNull();

            const remoteDeleted = await db.getFirstAsync<{
                deleted_at: string | null;
                remote_version: number;
                remote_state: string;
                sync_status: string;
            }>(
                `SELECT deleted_at, remote_version, remote_state, sync_status
     FROM local_routines WHERE id = ?`,
                failedRoutineId
            );

            expect(remoteDeleted).toEqual({
                deleted_at: expect.any(String),
                remote_version: 3,
                remote_state: "deleted",
                sync_status: "synced",
            });

            // No debe generar otra operación de subida.
            expect(await db.getAllAsync("SELECT * FROM sync_operations ORDER BY id")).toEqual(
                ownerQueueBefore
            );

            // Repetir la eliminación no debe modificar el registro.
            await expect(
                applyRemoteRoutineDeletion({
                    userId,
                    routineId: failedRoutineId,
                    remoteVersion: 3,
                })
            ).resolves.toBe(false);

            expect(
                await db.getFirstAsync(
                    `SELECT deleted_at, remote_version, remote_state, sync_status
         FROM local_routines WHERE id = ?`,
                    failedRoutineId
                )
            ).toEqual(remoteDeleted);
        } finally {
            await db.closeAsync();
        }
    });
});
