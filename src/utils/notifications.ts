import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let currentRestNotificationId: string | null = null;

export async function requestNotificationPermissions() {
    if (Platform.OS === "web") return false;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

export async function scheduleRestFinishedNotification(seconds: number) {
    if (seconds <= 0) return;

    if (currentRestNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(
            currentRestNotificationId
        );
    }

    currentRestNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: "Rest finished",
            body: "Time for your next set.",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
        },
    });
}

export async function cancelRestFinishedNotification() {
    if (!currentRestNotificationId) return;

    await Notifications.cancelScheduledNotificationAsync(currentRestNotificationId);
    currentRestNotificationId = null;
}