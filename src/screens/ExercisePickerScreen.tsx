import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Image,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useExercisePicker } from "../hooks/useExercisePicker";
import ExerciseListCard from "../components/exercise/ExerciseListCard";

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
        <View style={styles.container}>
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
                    const alreadyAdded = currentExerciseIds.includes(item.id);

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

            <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
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

    exerciseCard: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    exerciseCardAdded: {
        backgroundColor: "#1F2937",
        borderColor: "#4CAF50",
    },

    exerciseInfo: {
        flex: 1,
        paddingRight: 12,
    },

    exerciseTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },

    exerciseText: {
        color: "#9CA3AF",
        marginTop: 6,
    },

    alreadyAddedText: {
        color: "#4CAF50",
        marginTop: 6,
        fontWeight: "700",
    },

    addButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 10,
    },

    addButtonSecondary: {
        backgroundColor: "#2563EB",
    },

    addButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    list: {
        gap: 12,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#161B22",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#30363D",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
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
    exerciseImage: {
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
    infoButton: {
        backgroundColor: "#1F2937",
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginTop: 8,
    },
    infoButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    addButtonDisabled: {
        backgroundColor: "#374151",
        opacity: 0.7,
    },

    addButtonTextDisabled: {
        color: "#9CA3AF",
    },
});