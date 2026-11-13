import { Platform } from "react-native";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

export const isGoogleSignInAvailable = Platform.OS === "android" && Boolean(webClientId);

export async function getGoogleIdToken(): Promise<string | null> {
    if (!isGoogleSignInAvailable || !webClientId) {
        throw new Error("Google sign-in is unavailable.");
    }

    const { GoogleSignin, isCancelledResponse } =
        await import("@react-native-google-signin/google-signin");
    GoogleSignin.configure({ webClientId });
    const available = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    if (!available) throw new Error("Google Play Services is unavailable.");

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return null;
    if (!response.data.idToken) throw new Error("Google did not return an ID token.");
    return response.data.idToken;
}
