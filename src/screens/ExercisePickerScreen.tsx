import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useExercisePicker } from "../hooks/useExercisePicker";
import ExerciseListCard from "../components/exercise/ExerciseListCard";
import ScreenContainer from "../components/common/ScreenContainer";
import AppButton from "../components/common/AppButton";

type RouteParams = {
    ExercisePicker: {
        mode: "routine" | "session";
        routineId?: string;
        sessionId?: string;
        currentCount: number;
        currentExerciseIds: string[];
    };
};

export default function ExercisePickerScreen({ navigation }: any) {
    const route = useRoute<RouteProp<RouteParams, "ExercisePicker">>();
    const { mode, routineId, sessionId, currentCount, currentExerciseIds } =
        route.params;

    const {
        search,
        setSearch,
        filteredExercises,
        handleAddExercise,
        filterMode,
        changeFilterMode,
        filterOptions,
        selectedFilterIds,
        toggleFilterId,
    } = useExercisePicker({
        mode,
        routineId,
        sessionId,
        currentCount,
        onExerciseAdded: () => navigation.goBack(),
    });

    return (
        <ScreenContainer>
            <Text style={styles.title}>Add Exercise</Text>

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search exercise"
                    placeholderTextColor="#6B7280"
                    value={search}
                    onChangeText={setSearch}
                />

                <Pressable
                    style={styles.filterModeButton}
                    onPress={() =>
                        changeFilterMode(filterMode === "muscle" ? "region" : "muscle")
                    }
                >
                    <Text style={styles.filterModeText}>
                        {filterMode === "muscle" ? "Muscle" : "Region"}
                    </Text>
                </Pressable>
            </View>

            <View style={styles.filtersWrapper}>
                <FlatList
                    horizontal
                    data={filterOptions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.filters}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isSelected = selectedFilterIds.includes(item.id);

                        return (
                            <Pressable
                                style={[
                                    styles.filterChip,
                                    isSelected && styles.filterChipActive,
                                ]}
                                onPress={() => toggleFilterId(item.id)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        isSelected && styles.filterTextActive,
                                    ]}
                                >
                                    {item.name}
                                </Text>
                            </Pressable>
                        );
                    }}
                />
            </View>

            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.exerciseList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    return (
                        <ExerciseListCard
                            exercise={item}
                            alreadyAdded={currentExerciseIds.includes(item.id)}
                            showAddButton
                            onAdd={() => handleAddExercise(item.id)}
                            onMoreInfo={() =>
                                navigation.navigate("ExerciseDetail", {
                                    exerciseId: item.id,
                                })
                            }
                        />
                    );
                }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No exercises found.</Text>
                }
            />

            <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => navigation.goBack()}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    title: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 20,
    },
    filtersWrapper: {
        height: 52,
        marginBottom: 16,
    },
    filters: {
        gap: 10,
        alignItems: "center",
    },
    filterChip: {
        backgroundColor: "#161B22",
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#30363D",
        height: 38,
        justifyContent: "center",
    },
    filterChipActive: {
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
    },
    filterText: {
        color: "#9CA3AF",
        fontWeight: "700",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
    exerciseList: {
        gap: 12,
        paddingBottom: 24,
    },
    cancelButton: {
        backgroundColor: "#374151",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    cancelButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        textAlign: "center",
    },
    emptyText: {
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 24,
    },
    searchRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        backgroundColor: "#161B22",
        color: "#FFFFFF",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#30363D",
    },
    filterModeButton: {
        backgroundColor: "#161B22",
        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 12,
        paddingHorizontal: 14,
        justifyContent: "center",
    },

    filterModeText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
});