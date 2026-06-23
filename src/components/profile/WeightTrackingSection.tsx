import { View, Text, StyleSheet } from "react-native";
import { WeightLog } from "../../types/profile";
import WeightLogCard from "./WeightLogCard";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

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

            <AppInput
                placeholder="Weight kg"
                keyboardType="numeric"
                value={newWeight}
                onChangeText={onChangeWeight}
            />

            <AppButton
                title="Add Weight Log"
                variant="primary"
                onPress={onAddWeight}
            />

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
});