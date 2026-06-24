import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { initializeSounds } from "./src/utils/sounds";

export default function App() {
    useEffect(() => {
        initializeSounds();
    }, []);

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}
