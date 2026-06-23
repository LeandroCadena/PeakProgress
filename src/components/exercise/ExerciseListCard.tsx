import { Image, View, Text, StyleSheet } from "react-native";
import { Exercise } from "../../types/exercise";
import Card from "../common/Card";
import AppButton from "../common/AppButton";
import { colors } from "../../theme";

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
        <Card
            style={[
                styles.card,
                alreadyAdded ? styles.cardAdded : null,
            ]}
        >
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
                <AppButton
                    title="More Info"
                    variant="secondary"
                    onPress={onMoreInfo}
                />

                {showAddButton ? (
                    <AppButton
                        title={alreadyAdded ? "Added" : "Add"}
                        variant="success"
                        disabled={alreadyAdded}
                        onPress={onAdd ?? (() => { })}
                    />
                ) : null}
            </View>
        </Card>
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
        borderColor: colors.success,
        backgroundColor: colors.successDark,
        borderWidth: 2,
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
});