import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";

type Action = { label: string; onPress: () => void };

export default function StartupScreen({
    message,
    loading = true,
    action,
    secondaryAction,
}: {
    message: string;
    loading?: boolean;
    action?: Action;
    secondaryAction?: Action;
}) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gym Time</Text>
            {loading && <ActivityIndicator color="#F97316" size="large" />}
            <Text accessibilityLiveRegion="polite" style={styles.message}>
                {message}
            </Text>
            {action && <Button title={action.label} onPress={action.onPress} />}
            {secondaryAction && (
                <Button title={secondaryAction.label} onPress={secondaryAction.onPress} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#171717",
        padding: 24,
        gap: 16,
    },
    title: { color: "#FFFFFF", fontSize: 26, fontWeight: "bold" },
    message: { color: "#FFFFFF", textAlign: "center" },
});
