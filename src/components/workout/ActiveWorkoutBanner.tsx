import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    routineName: string;
    elapsedText: string;
    onPress: () => void;
};

export default function ActiveWorkoutBanner({
    routineName,
    elapsedText,
    onPress,
}: Props) {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <View>
                <Text style={styles.label}>Workout running</Text>
                <Text style={styles.title}>{routineName}</Text>
            </View>

            <Text style={styles.time}>{elapsedText}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#102A1A",
        borderColor: "#4CAF50",
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        color: "#4CAF50",
        fontWeight: "700",
        marginBottom: 4,
    },
    title: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 16,
    },
    time: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
});