import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useLanguage } from "../i18n/LanguageProvider";
import ExercisesScreen from "../screens/ExercisesScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import RoutinesScreen from "../screens/RoutinesScreen";
import { useAppTheme } from "../theme";

type MainTabsParamList = {
    Home: undefined;
    Routines: undefined;
    Exercises: undefined;
    Progress: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
    const { t } = useLanguage();
    const { colors } = useAppTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.cardBorder,
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
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: t("home") }} />
            <Tab.Screen
                name="Routines"
                component={RoutinesScreen}
                options={{ title: t("routines") }}
            />
            <Tab.Screen
                name="Exercises"
                component={ExercisesScreen}
                options={{ title: t("exercises") }}
            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}
                options={{ title: t("progress") }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: t("profile") }}
            />
        </Tab.Navigator>
    );
}
