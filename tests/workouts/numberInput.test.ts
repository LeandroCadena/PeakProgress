import { sanitizeIntegerInput, sanitizeWeightInput } from "../../src/utils/numberInput";

it.each([
    ["72,5", "72.5"],
    ["72.5", "72.5"],
    ["0,", "0."],
    [".5", "0.5"],
    ["", ""],
    ["025 kg", "25"],
])("normalizes a weight of %j to %j", (input, expected) => {
    expect(sanitizeWeightInput(input)).toBe(expected);
});

it("keeps repetitions as whole numbers", () => {
    expect(sanitizeIntegerInput("012 reps")).toBe("12");
});
