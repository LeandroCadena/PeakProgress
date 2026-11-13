import catalog from "../../supabase/catalog/exercises.json";
import type { Exercise, FilterMode } from "../types/exercise";

const groups = {
    Arms: ["Antebrazos", "Braquial", "Braquiorradial", "Bíceps", "Tríceps"],
    Back: [
        "Dorsal ancho",
        "Elevador de la escápula",
        "Erectores espinales",
        "Redondo mayor",
        "Romboides",
        "Trapecio",
    ],
    Chest: ["Pectoral mayor"],
    Core: ["Abdominales", "Oblicuos"],
    Glutes: ["Glúteo mayor", "Glúteo medio", "Glúteo menor"],
    Legs: [
        "Aductores",
        "Cuádriceps",
        "Flexores de cadera",
        "Gastrocnemio",
        "Isquiotibiales",
        "Sóleo",
        "Tensor de la fascia lata",
        "Tibial posterior",
    ],
    Shoulders: [
        "Deltoides anterior",
        "Deltoides lateral",
        "Deltoides posterior",
        "Infraespinoso",
        "Redondo menor",
        "Supraespinoso",
    ],
};

export const bundledRegions = Object.keys(groups).map((name) => ({ id: name, name }));
export const bundledMuscles = Object.values(groups)
    .flat()
    .sort()
    .map((name) => ({ id: name, name }));
const exercises = Object.values(catalog).flat();
const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

function withCover(exercise: Exercise): Exercise {
    return {
        ...exercise,
        image_url: projectUrl
            ? `${projectUrl}/storage/v1/object/public/exercise-media/exercises/${exercise.id}/cover.webp`
            : null,
    };
}

export function getBundledExercises({
    filterMode,
    selectedIds,
}: {
    filterMode: FilterMode;
    selectedIds: string[];
}) {
    const muscles = new Set(
        filterMode === "muscle"
            ? selectedIds
            : selectedIds.flatMap((id) => groups[id as keyof typeof groups] ?? [])
    );

    return exercises
        .filter(
            (exercise) =>
                selectedIds.length === 0 ||
                [...exercise.muscles_primary, ...exercise.muscles_secondary].some((name) =>
                    muscles.has(name)
                )
        )
        .map(withCover);
}

export function getBundledExercise(exerciseId: string) {
    const exercise = exercises.find(({ id }) => id === exerciseId);
    if (!exercise) return null;

    return {
        ...withCover(exercise),
        exercise_muscles: [
            ...exercise.muscles_primary.map((name) => ({ role: "primary", muscles: { name } })),
            ...exercise.muscles_secondary.map((name) => ({ role: "secondary", muscles: { name } })),
        ],
    };
}
