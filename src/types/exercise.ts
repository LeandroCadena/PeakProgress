export type FilterMode = "muscle" | "region";

export type Exercise = {
    id: string;
    name: string;
    name_es?: string | null;
    description_es?: string | null;
    instructions_es?: string | null;
    tips_es?: string | null;
    equipment: string | null;
    difficulty: string | null;
    image_url?: string | null;
    animation_url?: string | null;
    description?: string | null;
    instructions?: string | null;
    tips?: string | null;
};

export type Muscle = {
    id: string;
    name: string;
};

export type MuscleRegion = {
    id: string;
    name: string;
};
