import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import ExercisesScreen from "../screens/ExercisesScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import RoutinesScreen from "../screens/RoutinesScreen";
import { colors } from "../theme";

export type MainTabsParamList = {
    Home: undefined;
    Routines: undefined;
    Exercises: undefined;
    Progress: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: "#30363D",
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarIcon: ({ color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

                    if (route.name === "Home") iconName = "home-outline";
                    if (route.name === "Routines") iconName = "barbell-outline";
                    if (route.name === "Exercises") iconName = "fitness-outline";
                    if (route.name === "Progress") iconName = "stats-chart-outline";
                    if (route.name === "Profile") iconName = "person-outline";

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Routines" component={RoutinesScreen} />
            <Tab.Screen name="Exercises" component={ExercisesScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
