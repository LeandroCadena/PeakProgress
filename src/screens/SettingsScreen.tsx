import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
    getUserSettings,
    updateUserSettings,
    UserSettings,
} from "../services/settingsService";
import { setSoundsEnabled } from "../utils/sounds";
import { setNotificationsEnabled } from "../utils/notifications";
import ScreenContainer from "../components/common/ScreenContainer";

export default function SettingsScreen() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, [user?.id]);

    async function fetchSettings() {
        if (!user?.id) return;

        try {
            const data = await getUserSettings(user.id);
            setSettings(data);
            setSoundsEnabled(data.sounds_enabled);
            setNotificationsEnabled(data.notifications_enabled);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

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
        <ScreenContainer>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Sounds</Text>
                <Switch
                    value={settings.sounds_enabled}
                    onValueChange={(value) =>
                        updateSetting({ sounds_enabled: value })
                    }
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Notifications</Text>
                <Switch
                    value={settings.notifications_enabled}
                    onValueChange={(value) =>
                        updateSetting({ notifications_enabled: value })
                    }
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Use Global Timers</Text>
                <Switch
                    value={settings.use_global_timers}
                    onValueChange={(value) =>
                        updateSetting({ use_global_timers: value })
                    }
                />
            </View>

            {settings.use_global_timers ? (
                <>
                    <View style={styles.card}>
                        <Text style={styles.label}>Global Rest Between Sets</Text>
                        <TextInput
                            style={styles.input}
                            value={String(settings.global_set_rest_seconds)}
                            keyboardType="numeric"
                            placeholder="90"
                            placeholderTextColor="#6B7280"
                            onChangeText={(value) =>
                                updateSetting({
                                    global_set_rest_seconds: Number(value || 0),
                                })
                            }
                        />
                        <Text style={styles.helperText}>Seconds between sets</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>Global Rest Between Exercises</Text>
                        <TextInput
                            style={styles.input}
                            value={String(settings.global_exercise_rest_seconds)}
                            keyboardType="numeric"
                            placeholder="120"
                            placeholderTextColor="#6B7280"
                            onChangeText={(value) =>
                                updateSetting({
                                    global_exercise_rest_seconds: Number(value || 0),
                                })
                            }
                        />
                        <Text style={styles.helperText}>Seconds before the next exercise</Text>
                    </View>
                </>
            ) : null}

            <View style={styles.card}>
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
            </View>

            <View style={styles.card}>
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
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 20,
    },
    text: {
        color: "#9CA3AF",
    },
    card: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
    },
    label: {
        color: "#FFFFFF",
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
        backgroundColor: "#0B0F14",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#30363D",
    },
    optionButtonActive: {
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
    },
    optionText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    input: {
        backgroundColor: "#0B0F14",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: "#FFFFFF",
        marginTop: 6,
    },

    helperText: {
        color: "#9CA3AF",
        marginTop: 8,
    },
});