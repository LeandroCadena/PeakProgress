import { View, Text, StyleSheet } from "react-native";

import AvailableExerciseCard from "./AvailableExerciseCard";

type AvailableExercise = {
    id: string;
    name: string;
};

type Props = {
    exercises: AvailableExercise[];
    onAddExercise: (exerciseId: string) => void;
};

export default function AvailableExerciseSection({ exercises, onAddExercise }: Props) {
    return (
        <>
            <Text style={styles.sectionTitle}>Add exercise</Text>

            <View style={styles.list}>
                {exercises.map((item) => (
                    <AvailableExerciseCard
                        key={item.id}
                        exercise={item}
                        onPress={() => onAddExercise(item.id)}
                    />
                ))}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
        marginBottom: 12,
    },
    list: {
        gap: 12,
        paddingBottom: 12,
    },
});
