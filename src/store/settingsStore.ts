import { create } from "zustand";

import type { UserSettings } from "../services/settingsService";

type GlobalTimerSettings = Pick<
    UserSettings,
    "use_global_timers" | "global_set_rest_seconds" | "global_exercise_rest_seconds"
>;

type SettingsState = {
    userId: string | null;
    globalTimers: GlobalTimerSettings | null;
    isLoading: boolean;
    error: string | null;

    setGlobalTimers: (userId: string, settings: GlobalTimerSettings) => void;

    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    clearSettings: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
    userId: null,
    globalTimers: null,
    isLoading: false,
    error: null,

    setGlobalTimers: (userId, settings) => {
        set({
            userId,
            globalTimers: {
                use_global_timers: settings.use_global_timers,
                global_set_rest_seconds: settings.global_set_rest_seconds,
                global_exercise_rest_seconds: settings.global_exercise_rest_seconds,
            },
            isLoading: false,
            error: null,
        });
    },

    setLoading: (isLoading) => {
        set({ isLoading });
    },

    setError: (error) => {
        set({
            error,
            isLoading: false,
        });
    },

    clearSettings: () => {
        set({
            userId: null,
            globalTimers: null,
            isLoading: false,
            error: null,
        });
    },
}));
