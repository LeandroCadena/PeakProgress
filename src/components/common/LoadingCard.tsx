import { View, Text, StyleSheet } from "react-native";

type Props = {
    title?: string;
    message?: string;
};

export default function LoadingCard({
    title = "Preparing workout...",
    message = "Setting up your exercises and sets.",
}: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
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
    },

    title: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },

    message: {
        color: "#9CA3AF",
        marginTop: 6,
        lineHeight: 20,
    },
});