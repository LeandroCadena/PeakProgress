import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";

import { useAuth } from "../context/AuthContext";
import ExerciseDetailScreen from "../screens/ExerciseDetailScreen";
import ExercisePickerScreen from "../screens/ExercisePickerScreen";
import ExerciseProgressScreen from "../screens/ExerciseProgressScreen";
import ExercisesScreen from "../screens/ExercisesScreen";
import HistoryScreen from "../screens/HistoryScreen";
import LoginScreen from "../screens/LoginScreen";
import PersonalInformationScreen from "../screens/PersonalInformationScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoutineDetailScreen from "../screens/RoutineDetailScreen";
import SettingsScreen from "../screens/SettingsScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import WorkoutSummaryScreen from "../screens/WorkoutSummaryScreen";

import MainTabs from "./MainTabs";

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
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
        routineDescription: string;
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
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: "#0B0F14",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            />
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="History" component={HistoryScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen
                            name="PersonalInformation"
                            component={PersonalInformationScreen}
                        />
                        <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
                        <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
                        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
                        <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
                        <Stack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
                        <Stack.Screen name="Exercises" component={ExercisesScreen} />
                        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
                        <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
