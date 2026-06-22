import { View, Text, StyleSheet } from "react-native";

export default function EmptyStateCard() {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>No exercises found</Text>

            <Text style={styles.message}>
                This workout doesn't contain any exercises yet.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 16,
        padding: 20,
        marginVertical: 16,
        alignItems: "center",
    },

    title: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },

    message: {
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
});