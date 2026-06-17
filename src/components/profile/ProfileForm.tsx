import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";

type Props = {
    fullName: string;
    goal: string;
    experienceLevel: string;
    heightCm: string;
    weightKg: string;
    onChangeFullName: (value: string) => void;
    onChangeGoal: (value: string) => void;
    onChangeExperienceLevel: (value: string) => void;
    onChangeHeightCm: (value: string) => void;
    onChangeWeightKg: (value: string) => void;
    onSave: () => void;
};

export default function ProfileForm({
    fullName,
    goal,
    experienceLevel,
    heightCm,
    weightKg,
    onChangeFullName,
    onChangeGoal,
    onChangeExperienceLevel,
    onChangeHeightCm,
    onChangeWeightKg,
    onSave,
}: Props) {
    return (
        <View>
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#6B7280" value={fullName} onChangeText={onChangeFullName} />
            <TextInput style={styles.input} placeholder="Goal - e.g. Gain muscle" placeholderTextColor="#6B7280" value={goal} onChangeText={onChangeGoal} />
            <TextInput style={styles.input} placeholder="Experience - Beginner / Intermediate / Advanced" placeholderTextColor="#6B7280" value={experienceLevel} onChangeText={onChangeExperienceLevel} />
            <TextInput style={styles.input} placeholder="Height cm" placeholderTextColor="#6B7280" keyboardType="numeric" value={heightCm} onChangeText={onChangeHeightCm} />
            <TextInput style={styles.input} placeholder="Weight kg" placeholderTextColor="#6B7280" keyboardType="numeric" value={weightKg} onChangeText={onChangeWeightKg} />

            <Pressable style={styles.button} onPress={onSave}>
                <Text style={styles.buttonText}>Save Profile</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
});