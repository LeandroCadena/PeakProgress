import { View, Text, StyleSheet } from "react-native";
import { WeightLog } from "../../types/profile";
import Card from "../common/Card";
import AppButton from "../common/AppButton";

type Props = {
    log: WeightLog;
    onDelete: () => void;
};

export default function WeightLogCard({ log, onDelete }: Props) {
    return (
        <Card style={styles.weightLogCard}>
            <View>
                <Text style={styles.weightValue}>{log.weight_kg} kg</Text>
                <Text style={styles.weightDate}>
                    {new Date(log.logged_at).toLocaleDateString()}
                </Text>
            </View>

            <AppButton
                title="Delete"
                variant="danger"
                onPress={onDelete}
            />
        </Card>
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
});