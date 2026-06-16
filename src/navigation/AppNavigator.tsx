import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MainTabs from "./MainTabs";
import { useAuth } from "../context/AuthContext";
import RoutineDetailScreen from "../screens/RoutineDetailScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import WorkoutSummaryScreen from "../screens/WorkoutSummaryScreen";

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: undefined;
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
                        <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
                        <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
                        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
                        <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
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