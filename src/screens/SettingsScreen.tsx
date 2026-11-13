import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../i18n/LanguageProvider";
import { getUserSettings, updateUserSettings, UserSettings } from "../services/settingsService";
import { useSettingsStore } from "../store/settingsStore";
import { spacing, useAppTheme, createThemedStyles } from "../theme";
import { setNotificationsEnabled } from "../utils/notifications";
import { setSoundsEnabled } from "../utils/sounds";

export default function SettingsScreen() {
    const { language, setLanguage, t } = useLanguage();
    const { colors, sharedStyles, preference, setPreference } = useAppTheme();
    const styles = getStyles(colors);
    const { user } = useAuth();
    const { showToast } = useToast();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const setGlobalTimers = useSettingsStore((state) => state.setGlobalTimers);

    const [globalSetRestInput, setGlobalSetRestInput] = useState("");
    const [globalExerciseRestInput, setGlobalExerciseRestInput] = useState("");

    const updateQueueRef = useRef<Promise<void>>(Promise.resolve());
    const settingsRef = useRef<UserSettings | null>(null);
    const userIdRef = useRef<string | null>(null);
    const settingsRevisionRef = useRef(0);

    const applySettings = useCallback((nextSettings: UserSettings, ownerId: string) => {
        if (userIdRef.current !== ownerId) return;

        settingsRef.current = nextSettings;
        setSettings(nextSettings);
        setGlobalTimers(ownerId, nextSettings);
    }, [setGlobalTimers]);

    const fetchSettings = useCallback(async () => {
        if (!user?.id) return;

        const ownerId = user.id;
        const revisionAtStart = settingsRevisionRef.current;

        try {
            const data = await getUserSettings(ownerId);

            if (userIdRef.current !== ownerId || settingsRevisionRef.current !== revisionAtStart) {
                return;
            }

            applySettings(data, ownerId);

            setGlobalSetRestInput(String(data.global_set_rest_seconds));
            setGlobalExerciseRestInput(String(data.global_exercise_rest_seconds));

            setSoundsEnabled(data.sounds_enabled);
            setNotificationsEnabled(data.notifications_enabled);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("settingsLoadError"),
            });
        }
    }, [applySettings, user, showToast, t]);

    useEffect(() => {
        const ownerId = user?.id ?? null;

        if (userIdRef.current !== ownerId) {
            userIdRef.current = ownerId;
            settingsRevisionRef.current += 1;

            settingsRef.current = null;
            setSettings(null);

            setGlobalSetRestInput("");
            setGlobalExerciseRestInput("");

            useSettingsStore.getState().clearSettings();
        }

        if (ownerId) {
            void fetchSettings();
        }
    }, [user?.id, fetchSettings]);

    function updateSetting(updates: Partial<UserSettings>): Promise<void> {
        const ownerId = user?.id;

        if (!ownerId || !settingsRef.current) {
            return Promise.resolve();
        }

        settingsRevisionRef.current += 1;

        const operation = updateQueueRef.current.then(async () => {
            if (userIdRef.current !== ownerId) return;

            try {
                const updated = await updateUserSettings({
                    userId: ownerId,
                    updates,
                });

                if (userIdRef.current !== ownerId) return;

                applySettings(updated, ownerId);

                if (updates.global_set_rest_seconds !== undefined) {
                    setGlobalSetRestInput(String(updated.global_set_rest_seconds));
                }

                if (updates.global_exercise_rest_seconds !== undefined) {
                    setGlobalExerciseRestInput(String(updated.global_exercise_rest_seconds));
                }

                if (updates.sounds_enabled !== undefined) {
                    setSoundsEnabled(updated.sounds_enabled);
                }

                if (updates.notifications_enabled !== undefined) {
                    setNotificationsEnabled(updated.notifications_enabled);
                }
            } catch (error: unknown) {
                if (userIdRef.current !== ownerId) return;

                showToast({
                    type: "error",
                    message: error instanceof Error ? error.message : t("settingsSaveError"),
                });
            }
        });

        updateQueueRef.current = operation.then(
            () => undefined,
            () => undefined
        );

        return operation;
    }

    function saveGlobalRestInput(
        field: "global_set_rest_seconds" | "global_exercise_rest_seconds",
        input: string
    ) {
        const trimmed = input.trim();

        const currentValue = settingsRef.current?.[field];

        if (!/^\d+$/.test(trimmed)) {
            if (currentValue !== undefined) {
                if (field === "global_set_rest_seconds") {
                    setGlobalSetRestInput(String(currentValue));
                } else {
                    setGlobalExerciseRestInput(String(currentValue));
                }
            }
            return;
        }

        const value = Number(trimmed);

        if (!Number.isSafeInteger(value)) return;

        if (value === currentValue) return;

        void updateSetting({ [field]: value });
    }

    const appearance = (
        <Card style={styles.card}>
            <Text style={sharedStyles.screenTitle}>{t("appearance")}</Text>
            <Text style={styles.label}>{t("theme")}</Text>
            <View style={styles.row}>
                {(["dark", "light", "system"] as const).map((option) => (
                    <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected: preference === option }}
                        style={[
                            styles.optionButton,
                            preference === option && styles.optionButtonActive,
                        ]}
                        onPress={() => {
                            void setPreference(option).catch(() => {
                                showToast({ type: "error", message: t("themeSaveError") });
                            });
                        }}
                    >
                        <Text style={styles.optionText}>{t(option)}</Text>
                    </Pressable>
                ))}
            </View>
        </Card>
    );

    const languageSelector = (
        <Card style={styles.card}>
            <Text style={sharedStyles.screenTitle}>{t("language")}</Text>
            <View style={styles.row}>
                {(["en", "es"] as const).map((option) => (
                    <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected: language === option }}
                        style={[
                            styles.optionButton,
                            language === option && styles.optionButtonActive,
                        ]}
                        onPress={() => {
                            void setLanguage(option).catch(() => {
                                showToast({ type: "error", message: t("languageSaveError") });
                            });
                        }}
                    >
                        <Text style={styles.optionText}>
                            {option === "en" ? "English" : "Español"}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </Card>
    );

    if (!settings) {
        return (
            <ScreenContainer>
                <Text style={sharedStyles.screenTitle}>{t("settings")}</Text>
                {appearance}
                {languageSelector}
                <Text style={styles.text}>{t("loading")}</Text>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer scroll>
            <Text style={sharedStyles.screenTitle}>{t("settings")}</Text>
            {appearance}
            {languageSelector}

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>{t("sounds")}</Text>
                        <Text style={styles.helperText}>{t("workoutSounds")}</Text>
                    </View>

                    <Switch
                        value={settings.sounds_enabled}
                        onValueChange={(value) =>
                            updateSetting({
                                sounds_enabled: value,
                            })
                        }
                    />
                </View>
            </Card>

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>{t("notifications")}</Text>
                        <Text style={styles.helperText}>{t("enableNotifications")}</Text>
                    </View>

                    <Switch
                        value={settings.notifications_enabled}
                        onValueChange={(value) =>
                            updateSetting({
                                notifications_enabled: value,
                            })
                        }
                    />
                </View>
            </Card>

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>{t("updateRoutine")}</Text>

                        <Text style={styles.helperText}>{t("updateRoutineDescription")}</Text>
                    </View>

                    <Switch
                        value={settings.update_routine_after_workout}
                        onValueChange={(value) =>
                            updateSetting({
                                update_routine_after_workout: value,
                            })
                        }
                    />
                </View>
            </Card>

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>{t("globalTimers")}</Text>
                        <Text style={styles.helperText}>{t("globalTimers")}</Text>
                    </View>

                    <Switch
                        value={settings.use_global_timers}
                        onValueChange={(value) =>
                            updateSetting({
                                use_global_timers: value,
                            })
                        }
                    />
                </View>
            </Card>

            {settings.use_global_timers ? (
                <>
                    <Card style={styles.card}>
                        <Text style={styles.label}>{t("setRest")}</Text>
                        <AppInput
                            style={styles.input}
                            value={globalSetRestInput}
                            keyboardType="numeric"
                            placeholder="90"
                            onChangeText={setGlobalSetRestInput}
                            onBlur={() =>
                                saveGlobalRestInput("global_set_rest_seconds", globalSetRestInput)
                            }
                        />
                        <Text style={styles.helperText}>{t("setRestDescription")}</Text>
                    </Card>

                    <Card style={styles.card}>
                        <Text style={styles.label}>{t("exerciseRest")}</Text>
                        <AppInput
                            style={styles.input}
                            value={globalExerciseRestInput}
                            keyboardType="numeric"
                            placeholder="120"
                            onChangeText={setGlobalExerciseRestInput}
                            onBlur={() =>
                                saveGlobalRestInput(
                                    "global_exercise_rest_seconds",
                                    globalExerciseRestInput
                                )
                            }
                        />
                        <Text style={styles.helperText}>{t("exerciseRestDescription")}</Text>
                    </Card>
                </>
            ) : null}
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
    text: {
        color: colors.textSecondary,
    },
    card: {
        marginBottom: 14,
    },
    label: {
        color: colors.text,
        fontWeight: "800",
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.background,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    optionButtonActive: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    optionText: {
        color: colors.text,
        fontWeight: "700",
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: colors.text,
        marginTop: 6,
    },
    helperText: {
        color: colors.textSecondary,
        marginTop: 8,
    },
    settingCard: {
        marginBottom: spacing.md,
    },
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    settingInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
}));
