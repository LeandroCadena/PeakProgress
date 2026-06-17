import { View, Text, Pressable, StyleSheet } from "react-native";
import { WeightLog } from "../../types/profile";

type Props = {
    log: WeightLog;
    onDelete: () => void;
};

export default function WeightLogCard({ log, onDelete }: Props) {
    return (
        <View style={styles.weightLogCard}>
            <View>
                <Text style={styles.weightValue}>{log.weight_kg} kg</Text>
                <Text style={styles.weightDate}>
                    {new Date(log.logged_at).toLocaleDateString()}
                </Text>
            </View>

            <Pressable style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    weightLogCard: {
        backgroundColor: "#161B22",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    weightValue: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },
    weightDate: {
        color: "#9CA3AF",
        marginTop: 4,
    },
    deleteButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
});