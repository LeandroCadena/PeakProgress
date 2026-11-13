import type { ImageSourcePropType } from "react-native";

import type { RoutineCover } from "../../types/routineCover";

export const defaultRoutineCover: ImageSourcePropType = require("../../../assets/routine-placeholder.png");

export const routineCoverImages: Record<RoutineCover, ImageSourcePropType> = {
    chest: require("../../../assets/routine-covers/chest.webp"),
    back: require("../../../assets/routine-covers/back.webp"),
    legs: require("../../../assets/routine-covers/legs.webp"),
    shoulders: require("../../../assets/routine-covers/shoulders.webp"),
    arms: require("../../../assets/routine-covers/arms.webp"),
    core: require("../../../assets/routine-covers/core.webp"),
    fullBody: defaultRoutineCover,
};
