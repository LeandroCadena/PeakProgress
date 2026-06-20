import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import { initializeSounds } from "./src/utils/sounds";
import { useEffect } from "react";

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