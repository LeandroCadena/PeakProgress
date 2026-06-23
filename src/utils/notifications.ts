import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let notificationsEnabled = true;

export function setNotificationsEnabled(value: boolean) {
    notificationsEnabled = value;
}

export async function requestNotificationPermissions() {
    if (Platform.OS === "web") return false;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

export async function scheduleRestFinishedNotification(seconds: number) {
    if (!notificationsEnabled) return;
    if (Platform.OS === "web") return;
    if (seconds <= 0) return;

    await cancelRestFinishedNotification();

    await Notifications.scheduleNotificationAsync({
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
    if (Platform.OS === "web") return;

    const hadPendingNotification =
        (await Notifications.getAllScheduledNotificationsAsync()).length > 0;

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();

    return hadPendingNotification;
}
