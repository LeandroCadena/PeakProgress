import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Pressable, TextInput } from "react-native";

import ExerciseListCard from "../components/exercise/ExerciseListCard";
import { getMuscles, getExercisesByFilter, getMuscleRegions } from "../services/exerciseService";
import { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

export default function ExercisesScreen({ navigation }: any) {
    const [search, setSearch] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("muscle");
    const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [regions, setRegions] = useState<MuscleRegion[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    async function fetchFilters() {
        try {
            const [musclesData, regionsData] = await Promise.all([
                getMuscles(),
                getMuscleRegions(),
            ]);

            setMuscles(musclesData);
            setRegions(regionsData);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    useEffect(() => {
        fetchFilters();
    }, []);

    const fetchExercises = useCallback(async () => {
        try {
            const data = await getExercisesByFilter({
                filterMode,
                selectedIds: selectedFilterIds,
            });

            setExercises(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }, [filterMode, selectedFilterIds]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises, filterMode, selectedFilterIds]);

    const filterOptions = filterMode === "muscle" ? muscles : regions;

    const filteredExercises = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(search.toLowerCase())
    );

    function toggleFilterId(id: string) {
        setSelectedFilterIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }

    function changeFilterMode(mode: FilterMode) {
        setFilterMode(mode);
        setSelectedFilterIds([]);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Exercises</Text>

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
                    onPress={() => changeFilterMode(filterMode === "muscle" ? "region" : "muscle")}
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
                                style={[styles.filterChip, isSelected && styles.filterChipActive]}
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
                ListEmptyComponent={<Text style={styles.emptyText}>No exercises found.</Text>}
                renderItem={({ item }) => (
                    <ExerciseListCard
                        exercise={item}
                        onMoreInfo={() =>
                            navigation.navigate("ExerciseDetail", {
                                exerciseId: item.id,
                            })
                        }
                    />
                )}
            />
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
        marginBottom: 24,
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
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    cardText: {
        color: "#9CA3AF",
        marginTop: 6,
    },
    filters: {
        gap: 10,
        marginBottom: 20,
    },
    filterChip: {
        backgroundColor: "#161B22",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#30363D",
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
    exerciseList: {
        gap: 12,
        paddingBottom: 24,
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
    filtersWrapper: {
        height: 52,
        marginBottom: 16,
    },
});
