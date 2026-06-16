import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to PeakProgress</Text>
            <Text style={styles.subtitle}>Your gym dashboard will be here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        color: "#9CA3AF",
        fontSize: 16,
        textAlign: "center",
    },
});