import catalog from "../../supabase/catalog/exercises.json";
import type { Exercise } from "../types/exercise";

import type { Language } from "./messages";

const catalogById = new Map<string, Exercise>(
    Object.values(catalog)
        .flat()
        .map((exercise) => [exercise.id, exercise])
);

export function localizedExerciseName(
    id: string | null | undefined,
    fallback: string,
    language: Language
) {
    const exercise = id ? catalogById.get(id) : undefined;
    return language === "es" ? (exercise?.name_es ?? fallback) : fallback;
}

type LocalizedField = "name" | "description" | "instructions" | "tips";

export function localizedExerciseText<Field extends LocalizedField>(
    exercise: Exercise,
    field: Field,
    language: Language
): Exercise[Field] {
    if (language === "es") {
        const translatedField = `${field}_es` as const;
        const translation =
            exercise[translatedField]?.trim() ||
            catalogById.get(exercise.id)?.[translatedField]?.trim();
        if (translation) return translation;
    }

    return exercise[field];
}

function normalizeSearch(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function matchesExerciseName(exercise: Exercise, query: string, language: Language) {
    const normalizedQuery = normalizeSearch(query.trim());
    return (
        normalizeSearch(exercise.name).includes(normalizedQuery) ||
        normalizeSearch(localizedExerciseText(exercise, "name", language)).includes(normalizedQuery)
    );
}

const catalogSpanish: Readonly<Partial<Record<string, string>>> = {
    Bodyweight: "Peso corporal",
    Machine: "Máquina",
    Cable: "Polea",
    Dumbbell: "Mancuerna",
    Barbell: "Barra",
    "Trap Bar": "Barra hexagonal",
    Landmine: "Barra anclada",
    "EZ Bar": "Barra Z",
    "Smith Machine": "Máquina Smith",
    Kettlebell: "Pesa rusa",
    "Resistance Band": "Banda elástica",
    "Ab Wheel": "Rueda abdominal",
    "Back Extension Bench": "Banco de hiperextensiones",
    "Back Extension Bench and Plate": "Banco de hiperextensiones y disco",
    "Nordic Bench": "Banco nórdico",
    "Medicine Ball": "Balón medicinal",
    "Battle Ropes": "Cuerdas de batalla",
    Sled: "Trineo",
    Beginner: "Principiante",
    Intermediate: "Intermedio",
    Advanced: "Avanzado",
    Arms: "Brazos",
    Back: "Espalda",
    Chest: "Pecho",
    Core: "Zona media",
    Glutes: "Glúteos",
    Legs: "Piernas",
    Shoulders: "Hombros",
    Abdominals: "Abdominales",
    Abs: "Abdominales",
    Adductors: "Aductores",
    Forearms: "Antebrazos",
    Brachialis: "Braquial",
    Brachioradialis: "Braquiorradial",
    Biceps: "Bíceps",
    Quadriceps: "Cuádriceps",
    "Anterior deltoid": "Deltoides anterior",
    "Lateral deltoid": "Deltoides lateral",
    "Posterior deltoid": "Deltoides posterior",
    "Latissimus dorsi": "Dorsal ancho",
    "Levator scapulae": "Elevador de la escápula",
    "Spinal erectors": "Erectores espinales",
    "Hip flexors": "Flexores de cadera",
    Gastrocnemius: "Gastrocnemio",
    "Gluteus maximus": "Glúteo mayor",
    "Gluteus medius": "Glúteo medio",
    "Gluteus minimus": "Glúteo menor",
    Infraspinatus: "Infraespinoso",
    Hamstrings: "Isquiotibiales",
    Obliques: "Oblicuos",
    "Pectoralis major": "Pectoral mayor",
    "Teres major": "Redondo mayor",
    "Teres minor": "Redondo menor",
    Rhomboids: "Romboides",
    Supraspinatus: "Supraespinoso",
    Soleus: "Sóleo",
    "Tensor fasciae latae": "Tensor de la fascia lata",
    "Tibialis posterior": "Tibial posterior",
    Trapezius: "Trapecio",
    Triceps: "Tríceps",
    Calves: "Pantorrillas",
};

const catalogEnglish = new Map(Object.entries(catalogSpanish).map(([en, es]) => [es, en]));

export function localizedCatalogLabel(value: string | null, language: Language) {
    if (value === null) return null;
    return (language === "es" ? catalogSpanish[value] : catalogEnglish.get(value)) ?? value;
}
