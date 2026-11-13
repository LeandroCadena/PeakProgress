import { getLocales } from "expo-localization";

import type { Language } from "./messages";

const latinAmericanRegions = new Set(
    "419 AR BO BR CL CO CR CU DO EC GT HN HT MX NI PA PE PR PY SV UY VE".split(" ")
);

export function getDeviceLanguage(): Language {
    const region = getLocales()[0]?.regionCode;
    return region && latinAmericanRegions.has(region) ? "es" : "en";
}
