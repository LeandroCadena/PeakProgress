import { registerRootComponent } from "expo";
import { createElement, type ComponentType } from "react";

import { getDeviceLanguage } from "./src/i18n/deviceLanguage";
import StartupScreen from "./src/components/common/StartupScreen";

const hasSupabaseConfig = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

function MissingConfiguration() {
    return createElement(StartupScreen, {
        loading: false,
        message:
            getDeviceLanguage() === "es"
                ? "Esta versión de Gym Time no tiene configurada la conexión al servidor."
                : "This version of Gym Time is missing its server configuration.",
    });
}

// Load the app only after checking the configuration its modules require.
const Root: ComponentType = hasSupabaseConfig ? require("./App").default : MissingConfiguration;

registerRootComponent(Root);
