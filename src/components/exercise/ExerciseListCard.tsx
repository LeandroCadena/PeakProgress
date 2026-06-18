import { Image, View, Text, Pressable, StyleSheet } from "react-native";
import { Exercise } from "../../types/exercise";

type Props = {
    exercise: Exercise;
    alreadyAdded?: boolean;
    showAddButton?: boolean;
    onAdd?: () => void;
    onMoreInfo: () => void;
};

export default function ExerciseListCard({
    exercise,
    alreadyAdded = false,
    showAddButton = false,
    onAdd,
    onMoreInfo,
}: Props) {
    return (
        <View style={[styles.card, alreadyAdded && styles.cardAdded]}>
            {exercise.image_url ? (
                <Image source={{ uri: exercise.image_url }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No image</Text>
                </View>
            )}

            <Text style={styles.title}>{exercise.name}</Text>

            <Text style={styles.text}>
                {exercise.equipment ?? "No equipment"} ·{" "}
                {exercise.difficulty ?? "No difficulty"}
            </Text>

            {alreadyAdded ? (
                <Text style={styles.alreadyAddedText}>Already added</Text>
            ) : null}

            <View style={styles.actions}>
                <Pressable style={styles.infoButton} onPress={onMoreInfo}>
                    <Text style={styles.infoButtonText}>More Info</Text>
                </Pressable>

                {showAddButton ? (
                    <Pressable
                        style={[
                            styles.addButton,
                            alreadyAdded && styles.addButtonDisabled,
                        ]}
                        disabled={alreadyAdded}
                        onPress={onAdd}
                    >
                        <Text
                            style={[
                                styles.addButtonText,
                                alreadyAdded && styles.addButtonTextDisabled,
                            ]}
                        >
                            {alreadyAdded ? "Added" : "Add"}
                        </Text>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    cardAdded: {
        backgroundColor: "#1F2937",
        borderColor: "#4CAF50",
    },
    image: {
        width: "100%",
        height: 140,
        borderRadius: 12,
        marginBottom: 12,
    },
    imagePlaceholder: {
        height: 140,
        borderRadius: 12,
        backgroundColor: "#0B0F14",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    placeholderText: {
        color: "#9CA3AF",
    },
    title: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    text: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    alreadyAddedText: {
        color: "#4CAF50",
        marginTop: 6,
        fontWeight: "700",
    },
    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    infoButton: {
        flex: 1,
        backgroundColor: "#1F2937",
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    infoButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    addButton: {
        flex: 1,
        backgroundColor: "#4CAF50",
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    addButtonDisabled: {
        backgroundColor: "#374151",
        opacity: 0.7,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    addButtonTextDisabled: {
        color: "#9CA3AF",
    },
});