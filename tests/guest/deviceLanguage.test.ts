import { getLocales } from "expo-localization";

import { getDeviceLanguage } from "../../src/i18n/deviceLanguage";

jest.mock("expo-localization", () => ({ getLocales: jest.fn() }));

it.each([
    ["AR", "es"],
    ["419", "es"],
    ["BR", "es"],
    ["US", "en"],
    ["ES", "en"],
    [null, "en"],
])("selects %s as %s based on the configured region", (regionCode, expected) => {
    jest.mocked(getLocales).mockReturnValue([
        { regionCode } as ReturnType<typeof getLocales>[number],
    ]);
    expect(getDeviceLanguage()).toBe(expected);
});
