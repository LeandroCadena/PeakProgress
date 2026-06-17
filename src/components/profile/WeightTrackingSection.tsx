import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { WeightLog } from "../../types/profile";
import WeightLogCard from "./WeightLogCard";

type Props = {
    newWeight: string;
    onChangeWeight: (value: string) => void;
    onAddWeight: () => void;
    weightLogs: WeightLog[];
    onDeleteWeight: (id: string) => void;
};

export default function WeightTrackingSection({
    newWeight,
    onChangeWeight,
    onAddWeight,
    weightLogs,
    onDeleteWeight,
}: Props) {
    return (
        <View>
            <Text style={styles.sectionTitle}>Weight Tracking</Text>

            <TextInput
                style={styles.input}
                placeholder="Weight kg"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={newWeight}
                onChangeText={onChangeWeight}
            />

            <Pressable style={styles.button} onPress={onAddWeight}>
                <Text style={styles.buttonText}>Add Weight Log</Text>
            </Pressable>

            {weightLogs.map((log) => (
                <WeightLogCard
                    key={log.id}
                    log={log}
                    onDelete={() => onDeleteWeight(log.id)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 24,
        marginBottom: 12,
    },
    input: {
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 12,
    },
    buttonText: {
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "700",
    },
});