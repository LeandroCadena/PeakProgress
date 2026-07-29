import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REST_NOTIFICATION_ID = "rest-finished";
const REST_NOTIFICATION_CHANNEL_ID = "workout-rest";

let notificationsEnabled = true;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export function setNotificationsEnabled(value: boolean) {
    notificationsEnabled = value;
}

async function configureNotificationChannel() {
    if (Platform.OS !== "android") return;

    await Notifications.setNotificationChannelAsync(REST_NOTIFICATION_CHANNEL_ID, {
        name: "Workout rest timers",
        description: "Notifications when a workout rest timer finishes",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
    });
}

async function requestNotificationPermissions() {
    if (Platform.OS === "web") return false;

    /*
     * On Android 13+, a channel must exist before Android can
     * display the notification permission prompt.
     */
    await configureNotificationChannel();

    const currentPermissions = await Notifications.getPermissionsAsync();

    if (currentPermissions.status === "granted") {
        return true;
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();

    return requestedPermissions.status === "granted";
}

export async function scheduleRestFinishedNotification(seconds: number) {
    if (!notificationsEnabled) return null;
    if (Platform.OS === "web") return null;
    if (seconds <= 0) return null;

    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
        return null;
    }

    await cancelRestFinishedNotification();

    return Notifications.scheduleNotificationAsync({
        identifier: REST_NOTIFICATION_ID,
        content: {
            title: "Rest finished",
            body: "Time for your next set.",
            sound: true,
            data: {
                type: "rest-finished",
            },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            channelId: Platform.OS === "android" ? REST_NOTIFICATION_CHANNEL_ID : undefined,
        },
    });
}

export async function cancelRestFinishedNotification() {
    if (Platform.OS === "web") return false;

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    const hadPendingNotification = scheduledNotifications.some(
        (notification) => notification.identifier === REST_NOTIFICATION_ID
    );

    await Notifications.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID);

    try {
        await Notifications.dismissNotificationAsync(REST_NOTIFICATION_ID);
    } catch {
        // The notification may not have been displayed yet.
    }

    return hadPendingNotification;
}
