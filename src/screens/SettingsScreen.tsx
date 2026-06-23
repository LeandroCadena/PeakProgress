import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import AppInput from "../components/common/AppInput";
import Card from "../components/common/Card";
import ScreenContainer from "../components/common/ScreenContainer";
import SectionTitle from "../components/common/SectionTitle";
import { useAuth } from "../context/AuthContext";
import { getUserSettings, updateUserSettings, UserSettings } from "../services/settingsService";
import { colors, spacing, typography } from "../theme";
import { setNotificationsEnabled } from "../utils/notifications";
import { setSoundsEnabled } from "../utils/sounds";

export default function SettingsScreen() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);

    const fetchSettings = useCallback(async () => {
        if (!user?.id) return;

        try {
            const data = await getUserSettings(user.id);
            setSettings(data);
            setSoundsEnabled(data.sounds_enabled);
            setNotificationsEnabled(data.notifications_enabled);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [user]);

    useEffect(() => {
        fetchSettings();
    }, [user?.id, fetchSettings]);

    async function updateSetting(updates: Partial<UserSettings>) {
        if (!user?.id || !settings) return;

        try {
            const updated = await updateUserSettings({
                userId: user.id,
                updates,
            });

            setSettings(updated);

            if (updates.sounds_enabled !== undefined) {
                setSoundsEnabled(updates.sounds_enabled);
            }

            if (updates.notifications_enabled !== undefined) {
                setNotificationsEnabled(updates.notifications_enabled);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    if (!settings) {
        return (
            <ScreenContainer>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.text}>Loading...</Text>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer scroll>
            <Text style={styles.title}>Settings</Text>

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>Sounds</Text>
                        <Text style={styles.helperText}>
                            Play sounds during workouts
                        </Text>
                    </View>

                    <Switch
                        value={settings.sounds_enabled}
                        onValueChange={(value) =>
                            updateSetting({ sounds_enabled: value })
                        }
                    />
                </View>
            </Card>

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>Notifications</Text>
                        <Text style={styles.helperText}>
                            Enable notifications
                        </Text>
                    </View>

                    <Switch
                        value={settings.notifications_enabled}
                        onValueChange={(value) =>
                            updateSetting({ notifications_enabled: value })
                        }
                    />
                </View>
            </Card>

            <Card style={styles.settingCard}>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.label}>Use Global Timers</Text>
                        <Text style={styles.helperText}>
                            Use Global Timers
                        </Text>
                    </View>

                    <Switch
                        value={settings.use_global_timers}
                        onValueChange={(value) =>
                            updateSetting({ use_global_timers: value })
                        }
                    />
                </View>
            </Card>

            {settings.use_global_timers ? (
                <>
                    <Card style={styles.card}>
                        <Text style={styles.label}>Global Rest Between Sets</Text>
                        <AppInput
                            style={styles.input}
                            value={String(settings.global_set_rest_seconds)}
                            keyboardType="numeric"
                            placeholder="90"
                            onChangeText={(value) =>
                                updateSetting({
                                    global_set_rest_seconds: Number(value || 0),
                                })
                            }
                        />
                        <Text style={styles.helperText}>Seconds between sets</Text>
                    </Card>

                    <Card style={styles.card}>
                        <Text style={styles.label}>Global Rest Between Exercises</Text>
                        <AppInput
                            style={styles.input}
                            value={String(settings.global_exercise_rest_seconds)}
                            keyboardType="numeric"
                            placeholder="120"
                            onChangeText={(value) =>
                                updateSetting({
                                    global_exercise_rest_seconds: Number(value || 0),
                                })
                            }
                        />
                        <Text style={styles.helperText}>Seconds before the next exercise</Text>
                    </Card>
                </>
            ) : null}

            <Card style={styles.card}>
                <SectionTitle>Appearance</SectionTitle>
                <Text style={styles.label}>Theme</Text>

                <View style={styles.row}>
                    <Pressable
                        style={[
                            styles.optionButton,
                            settings.theme === "dark" && styles.optionButtonActive,
                        ]}
                        onPress={() => updateSetting({ theme: "dark" })}
                    >
                        <Text style={styles.optionText}>Dark</Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.optionButton,
                            settings.theme === "light" && styles.optionButtonActive,
                        ]}
                        onPress={() => updateSetting({ theme: "light" })}
                    >
                        <Text style={styles.optionText}>Light</Text>
                    </Pressable>
                </View>
            </Card>

            <Card style={styles.card}>
                <SectionTitle>Language</SectionTitle>
                <Text style={styles.label}>Language</Text>

                <View style={styles.row}>
                    <Pressable
                        style={[
                            styles.optionButton,
                            settings.language === "en" && styles.optionButtonActive,
                        ]}
                        onPress={() => updateSetting({ language: "en" })}
                    >
                        <Text style={styles.optionText}>English</Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.optionButton,
                            settings.language === "es" && styles.optionButtonActive,
                        ]}
                        onPress={() => updateSetting({ language: "es" })}
                    >
                        <Text style={styles.optionText}>Español</Text>
                    </Pressable>
                </View>
            </Card>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightExtraBold,
        marginBottom: spacing.lg,
    },
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
});
