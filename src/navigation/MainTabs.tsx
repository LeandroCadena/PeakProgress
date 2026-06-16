import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import RoutinesScreen from "../screens/RoutinesScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen";

export type MainTabsParamList = {
    Home: undefined;
    Routines: undefined;
    Progress: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle: {
                    backgroundColor: "#0B0F14",
                },
                headerTintColor: "#FFFFFF",
                tabBarStyle: {
                    backgroundColor: "#0B0F14",
                    borderTopColor: "#30363D",
                },
                tabBarActiveTintColor: "#4CAF50",
                tabBarInactiveTintColor: "#9CA3AF",
                tabBarIcon: ({ color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

                    if (route.name === "Home") iconName = "home-outline";
                    if (route.name === "Routines") iconName = "barbell-outline";
                    if (route.name === "Progress") iconName = "stats-chart-outline";
                    if (route.name === "Profile") iconName = "person-outline";

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Routines" component={RoutinesScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}