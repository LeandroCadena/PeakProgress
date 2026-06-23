import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert, Pressable, TextInput } from "react-native";

import AppInput from "../components/common/AppInput";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import ExerciseListCard from "../components/exercise/ExerciseListCard";
import { getMuscles, getExercisesByFilter, getMuscleRegions } from "../services/exerciseService";
import { colors, componentStyles, spacing, typography } from "../theme";
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
        <ScreenContainer contentStyle={styles.screenContent}>
            <Text style={styles.title}>Exercises</Text>

            <View style={styles.searchRow}>
                <AppInput
                    style={styles.searchInput}
                    placeholder="Search exercise"
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
                ListEmptyComponent={
                    <EmptyStateCard
                        title="No exercises found"
                        message="Try changing your search or filters."
                    />
                }
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
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: spacing.lg,
    },
    title: {
        color: colors.text,
        fontSize: typography.title,
        fontWeight: typography.weightExtraBold,
        marginBottom: spacing.lg,
    },
    searchRow: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
    },
    filterModeButton: {
        backgroundColor: colors.card,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
        borderRadius: componentStyles.buttonRadius,
        paddingHorizontal: spacing.md,
        justifyContent: "center",
    },
    filterModeText: {
        color: colors.text,
        fontWeight: typography.weightBold,
    },
    filtersWrapper: {
        height: 52,
        marginBottom: spacing.md,
    },
    filters: {
        gap: spacing.sm,
        alignItems: "center",
    },
    filterChip: {
        backgroundColor: colors.card,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 20,
        borderWidth: componentStyles.borderWidth,
        borderColor: colors.cardBorder,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        color: colors.textSecondary,
        fontWeight: typography.weightBold,
    },
    filterTextActive: {
        color: colors.text,
    },
    exerciseList: {
        gap: spacing.md,
        paddingBottom: spacing.xxl,
    },
});