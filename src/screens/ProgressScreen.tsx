import { View, Text, StyleSheet } from "react-native";

export default function ProgressScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Your gym progress will be here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 8,
    },
});