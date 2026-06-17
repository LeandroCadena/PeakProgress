import { Pressable, Text, StyleSheet } from "react-native";
import { Exercise } from "../../types/exercise";

type AvailableExercise = {
    id: string;
    name: string;
};

type Props = {
    exercise: AvailableExercise;
    onPress: () => void;
};

export default function AvailableExerciseCard({ exercise, onPress }: Props) {
    return (
        <Pressable style={styles.addCard} onPress={onPress}>
            <Text style={styles.cardTitle}>{exercise.name}</Text>
            <Text style={styles.cardText}>Tap to add</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    addCard: {
        backgroundColor: "#102A1A",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#4CAF50",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
});