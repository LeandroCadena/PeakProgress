import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MainTabs from "./MainTabs";
import { useAuth } from "../context/AuthContext";

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: undefined;
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
                    <Stack.Screen name="Main" component={MainTabs} />
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