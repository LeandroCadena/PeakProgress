import type { RoutineEditorSnapshot } from "../store/routineEditorStore";

import { getDatabase } from "./database";
import { getLocalRoutine, saveLocalRoutine } from "./repositories/routineRepository";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`[SQLite Test] ${message}`);
    }
}

export async function testRoutineRepository(): Promise<void> {
    const db = await getDatabase();

    // IDs reservados para la prueba: no utilizamos
    // identificadores de usuarios ni rutinas reales.
    const userId = "__sqlite_test_user__";
    const routineId = "__sqlite_test_routine__";
    const exerciseId = "__sqlite_test_routine_exercise__";
    const setId = "__sqlite_test_set__";

    const snapshot: RoutineEditorSnapshot = {
        routineId,
        name: "SQLite Test Routine",
        exercises: [
            {
                id: exerciseId,
                routine_id: routineId,
                exercise_id: "__sqlite_test_exercise_catalog__",
                position: 0,
                rest_seconds: 90,
                exercise_rest_seconds: 120,
                exercise: {
                    name: "Test Bench Press",
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
                    weight: 50,
                    is_pr: false,
                    created_at: "2026-01-01T12:00:00.000Z",
                },
            ],
        },
    };

    try {
        // 1. Guardar.
        await saveLocalRoutine({ userId, snapshot });

        // 2. Recuperar.
        const restored = await getLocalRoutine({
            userId,
            routineId,
        });

        assert(restored !== null, "Routine was not restored.");

        if (!restored) {
            return;
        }

        // 3. Verificar los datos.
        assert(restored.name === snapshot.name, "Name mismatch");

        assert(restored.exercises.length === 1, "Exercise count mismatch");

        const exercise = restored.exercises[0];

        assert(exercise.position === 0, "Position mismatch");
        assert(exercise.rest_seconds === 90, "Set rest mismatch");
        assert(exercise.exercise_rest_seconds === 120, "Exercise rest mismatch");
        assert(exercise.exercise?.name === "Test Bench Press", "Exercise name mismatch");

        const sets = restored.setsByExerciseId[exerciseId] ?? [];

        assert(sets.length === 1, "Set count mismatch");
        assert(sets[0].reps === 10, "Reps mismatch");
        assert(sets[0].weight === 50, "Weight mismatch");
        assert(sets[0].is_pr === false, "PR mismatch");

        // 4. Comprobar aislamiento entre usuarios.
        const anotherUserRoutine = await getLocalRoutine({
            userId: "__another_sqlite_test_user__",
            routineId,
        });

        assert(anotherUserRoutine === null, "User isolation failed");

        console.log("[SQLite Test] Routine persistence PASSED");
        console.log("[SQLite Test] User isolation PASSED");
    } finally {
        // Limpiamos exclusivamente los datos de prueba.
        // ON DELETE CASCADE elimina sus ejercicios y series.
        await db.runAsync(
            `DELETE FROM local_routines
             WHERE id = ? AND user_id = ?`,
            [routineId, userId]
        );
    }
}
