import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Alert } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import { getExerciseProgressPoints } from "../services/progressService";

type RouteParams = {
    ExerciseProgress: {
        exerciseId: string;
        exerciseName: string;
    };
};

type ProgressPoint = {
    weight: number | null;
    reps: number;
    created_at: string;
};

export default function ExerciseProgressScreen() {
    const route = useRoute<RouteProp<RouteParams, "ExerciseProgress">>();
    const { exerciseId, exerciseName } = route.params;

    const [points, setPoints] = useState<ProgressPoint[]>([]);

    async function fetchExerciseProgress() {
        try {
            const data = await getExerciseProgressPoints(exerciseId);
            setPoints(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    useEffect(() => {
        fetchExerciseProgress();
    }, []);

    const chartData = points.length
        ? {
            labels: points.map((_, index) => `${index + 1}`),
            datasets: [
                {
                    data: points.map((point) => Number(point.weight ?? 0)),
                },
            ],
        }
        : {
            labels: ["0"],
            datasets: [{ data: [0] }],
        };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.subtitle}>Weight progression</Text>

            <LineChart
                data={chartData}
                width={Dimensions.get("window").width - 48}
                height={240}
                yAxisSuffix="kg"
                chartConfig={{
                    backgroundColor: "#161B22",
                    backgroundGradientFrom: "#161B22",
                    backgroundGradientTo: "#161B22",
                    decimalPlaces: 0,
                    color: () => "#4CAF50",
                    labelColor: () => "#9CA3AF",
                }}
                bezier
                style={styles.chart}
            />

            <Text style={styles.info}>
                Each point represents one saved set.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 24,
        paddingTop: 64,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
    },
    subtitle: {
        color: "#9CA3AF",
        marginTop: 6,
        marginBottom: 20,
    },
    chart: {
        borderRadius: 16,
    },
    info: {
        color: "#9CA3AF",
        marginTop: 16,
    },
});