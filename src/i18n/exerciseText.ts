import type { Exercise } from "../types/exercise";
import type { Language } from "./messages";

type LocalizedField = "name" | "description" | "instructions" | "tips";

export function localizedExerciseText<Field extends LocalizedField>(
    exercise: Exercise,
    field: Field,
    language: Language
): Exercise[Field] {
    if (language === "es") {
        const translation = exercise[`${field}_es`]?.trim();
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
