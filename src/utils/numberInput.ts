export function sanitizeIntegerInput(value: string) {
    const digitsOnly = value.replace(/[^0-9]/g, "");

    if (digitsOnly === "") {
        return "";
    }

    const normalized = digitsOnly.replace(/^0+/, "");

    return normalized === "" ? "0" : normalized;
}

export function sanitizeWeightInput(value: string) {
    const [whole, ...fraction] = value.replace(/[^0-9.,]/g, "").split(/[.,]/);
    if (fraction.length === 0) return sanitizeIntegerInput(whole);

    return `${sanitizeIntegerInput(whole) || "0"}.${fraction.join("")}`;
}

export function displayZeroAsEmpty(value: number | string | null | undefined) {
    if (value === null || value === undefined) return "";

    const stringValue = String(value);

    return stringValue === "0" ? "" : stringValue;
}
