export const routineCovers = [
    "chest",
    "back",
    "legs",
    "shoulders",
    "arms",
    "core",
    "fullBody",
] as const;

export type RoutineCover = (typeof routineCovers)[number];

export function isRoutineCover(value: unknown): value is RoutineCover {
    return routineCovers.some((cover) => cover === value);
}
