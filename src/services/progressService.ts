import { GUEST_USER_ID } from "../database/guestAccount";
import { getLocalWorkoutEntries } from "../database/repositories/localWorkoutRepository";
import type { ExerciseProgress, ExerciseRecordsById, UserExerciseRecord } from "../types/progress";

import { supabase } from "./supabase";

async function getLocalRecords(userId: string) {
    const records = new Map<string, ExerciseProgress & { bestSetId: string }>();
    for (const set of await getLocalWorkoutEntries(userId)) {
        if (!set.exercise_id) continue;
        const volume = set.weight * set.reps;
        if ((records.get(set.exercise_id)?.bestVolume ?? -1) >= volume) continue;
        records.set(set.exercise_id, {
            exerciseId: set.exercise_id,
            exerciseName: set.exercise_name_snapshot,
            bestVolume: volume,
            bestWeight: set.weight,
            bestReps: set.reps,
            bestSetId: set.id,
        });
    }
    return [...records.values()];
}

function mergeRecords<T extends { exerciseId: string; bestVolume: number }>(
    remote: T[],
    local: T[]
) {
    const records = new Map(remote.map((record) => [record.exerciseId, record]));
    for (const record of local) {
        if ((records.get(record.exerciseId)?.bestVolume ?? -1) < record.bestVolume) {
            records.set(record.exerciseId, record);
        }
    }
    return [...records.values()].sort((a, b) => b.bestVolume - a.bestVolume);
}

export async function getExerciseProgress(userId: string): Promise<ExerciseProgress[]> {
    const local = await getLocalRecords(userId);
    if (userId === GUEST_USER_ID) return mergeRecords([], local);
    const { data, error } = await supabase
        .from("user_exercise_records")
        .select(
            `
        exercise_id,
        best_volume,
        best_weight,
        best_reps,
        exercises (
            name
        )
        `
        )
        .eq("user_id", userId)
        .order("best_volume", { ascending: false });

    if (error) throw error;

    return mergeRecords<ExerciseProgress>(
        (data ?? []).map((item: any) => {
            const exercise = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;

            return {
                exerciseId: item.exercise_id,
                exerciseName: exercise?.name ?? "Exercise",
                bestVolume: Number(item.best_volume ?? 0),
                bestWeight: Number(item.best_weight ?? 0),
                bestReps: Number(item.best_reps ?? 0),
            };
        }),
        local
    );
}

export async function getExerciseProgressPoints(exerciseId: string, userId: string) {
    const local = (await getLocalWorkoutEntries(userId))
        .filter((set) => set.exercise_id === exerciseId)
        .map(({ weight, reps, created_at }) => ({ weight, reps, created_at }));
    if (userId === GUEST_USER_ID)
        return local.sort((a, b) => a.created_at.localeCompare(b.created_at));

    const { data, error } = await supabase
        .from("workout_sets")
        .select("weight, reps, created_at")
        .eq("exercise_id", exerciseId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return [...(data ?? []), ...local].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function upsertUserExerciseRecord(params: {
    userId: string;
    exerciseId: string;
    bestVolume: number;
    bestWeight: number;
    bestReps: number;
    bestSetId: string;
}) {
    const { error } = await supabase.from("user_exercise_records").upsert(
        {
            user_id: params.userId,
            exercise_id: params.exerciseId,
            best_volume: params.bestVolume,
            best_weight: params.bestWeight,
            best_reps: params.bestReps,
            best_set_id: params.bestSetId,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "user_id,exercise_id",
        }
    );

    if (error) throw error;
}

export async function getUserExerciseRecords(userId: string): Promise<ExerciseRecordsById> {
    const local = await getLocalRecords(userId);
    if (userId === GUEST_USER_ID)
        return Object.fromEntries(local.map((record) => [record.exerciseId, record]));

    const { data, error } = await supabase
        .from("user_exercise_records")
        .select(
            `
            exercise_id,
            best_volume,
            best_weight,
            best_reps,
            best_set_id
        `
        )
        .eq("user_id", userId);

    if (error) throw error;

    return Object.fromEntries(
        mergeRecords(
            (data ?? []).map((record) => {
                const normalizedRecord: UserExerciseRecord = {
                    exerciseId: record.exercise_id,
                    bestVolume: Number(record.best_volume ?? 0),
                    bestWeight: Number(record.best_weight ?? 0),
                    bestReps: Number(record.best_reps ?? 0),
                    bestSetId: record.best_set_id ?? null,
                };

                return normalizedRecord;
            }),
            local
        ).map((record) => [record.exerciseId, record])
    );
}
