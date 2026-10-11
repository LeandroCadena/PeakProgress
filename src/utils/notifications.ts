import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REST_NOTIFICATION_ID = "rest-finished";
const REST_NOTIFICATION_CHANNEL_ID = "workout-rest";

let notificationsEnabled = true;
let restNotificationQueue: Promise<void> = Promise.resolve();
let restNotificationVersion = 0;

function enqueueRestNotificationOperation<T>(operation: () => Promise<T>): Promise<T> {
    const result = restNotificationQueue.then(operation);

    restNotificationQueue = result.then(
        () => undefined,
        () => undefined
    );

    return result;
}

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

export async function scheduleRestFinishedNotification(endAt: number) {
    if (
        !notificationsEnabled ||
        Platform.OS === "web" ||
        !Number.isFinite(endAt) ||
        endAt <= Date.now()
    ) {
        return null;
    }

    const version = ++restNotificationVersion;

    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission || version !== restNotificationVersion) {
        return null;
    }

    return enqueueRestNotificationOperation(async () => {
        if (version !== restNotificationVersion) {
            return null;
        }

        await cancelRestFinishedNotificationInternal();

        if (version !== restNotificationVersion || endAt <= Date.now()) {
            return null;
        }

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
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: new Date(endAt),
                channelId: Platform.OS === "android" ? REST_NOTIFICATION_CHANNEL_ID : undefined,
            },
        });
    });
}

async function cancelRestFinishedNotificationInternal() {
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

export function cancelRestFinishedNotification() {
    restNotificationVersion += 1;

    return enqueueRestNotificationOperation(cancelRestFinishedNotificationInternal);
}
