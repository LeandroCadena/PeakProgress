import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";

import StartupScreen from "../components/common/StartupScreen";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageProvider";
import ExerciseDetailScreen from "../screens/ExerciseDetailScreen";
import ExercisePickerScreen from "../screens/ExercisePickerScreen";
import ExerciseProgressScreen from "../screens/ExerciseProgressScreen";
import ExercisesScreen from "../screens/ExercisesScreen";
import HistoryScreen from "../screens/HistoryScreen";
import LoginScreen from "../screens/LoginScreen";
import PersonalInformationScreen from "../screens/PersonalInformationScreen";
import RoutineDetailScreen from "../screens/RoutineDetailScreen";
import SettingsScreen from "../screens/SettingsScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import WorkoutSummaryScreen from "../screens/WorkoutSummaryScreen";
import { useAppTheme } from "../theme";

import MainTabs from "./MainTabs";

type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    History: {
        sessionId: string;
        routineName: string;
    };
    Settings: {
        sessionId: string;
        routineName: string;
    };
    PersonalInformation: {
        sessionId: string;
        routineName: string;
    };
    RoutineDetail: {
        routineId: string;
        routineName: string;
    };
    WorkoutSession: {
        sessionId: string;
        routineId: string;
        routineName: string;
    };
    WorkoutDetail: {
        sessionId: string;
        routineName: string;
    };
    WorkoutSummary: {
        sessionId: string;
        routineName: string;
    };
    ExerciseProgress: {
        exerciseId: string;
        exerciseName: string;
    };
    Exercises: undefined;
    ExerciseDetail: {
        exerciseId: string;
    };
    ExercisePicker: {
        mode: "routine" | "session";
        routineId?: string;
        sessionId?: string;
        currentCount: number;
        currentExerciseIds: string[];
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { session, loading, issue, retry, continueOffline } = useAuth();
    const { t } = useLanguage();
    const { colors, isDark } = useAppTheme();
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    const navigationTheme = {
        ...baseTheme,
        colors: {
            ...baseTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.cardBorder,
            notification: colors.danger,
        },
    };

    if (loading) return <StartupScreen message={t("startupAccount")} />;

    if (issue) {
        return (
            <StartupScreen
                message={t(issue)}
                loading={false}
                action={
                    issue === "emailConfirmationError"
                        ? undefined
                        : { label: t("startupRetry"), onPress: retry }
                }
                secondaryAction={{ label: t("continueOffline"), onPress: continueOffline }}
            />
        );
    }

    return (
        <NavigationContainer key={session?.user.id ?? "guest"} theme={navigationTheme}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
                <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
                <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
                <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
                <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
                <Stack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
                <Stack.Screen name="Exercises" component={ExercisesScreen} />
                <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
                <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
                {!session && (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
