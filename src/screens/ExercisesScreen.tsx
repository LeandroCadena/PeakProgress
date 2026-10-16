import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import AppInput from "../components/common/AppInput";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import ExerciseListCard from "../components/exercise/ExerciseListCard";
import { useToast } from "../context/ToastContext";
import { useCatalogRevision } from "../hooks/useCatalogRevision";
import { CatalogNotDownloadedError, getCatalogAvailability, getExercisesByFilter, getMuscleRegions, getMuscles } from "../services/exerciseService";
import { colors, componentStyles, sharedStyles, spacing, typography } from "../theme";
import { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

export default function ExercisesScreen({ navigation }: any) {
    const { showToast } = useToast();
    const [search, setSearch] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("muscle");
    const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [regions, setRegions] = useState<MuscleRegion[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const catalogRevision = useCatalogRevision();
    const [catalogPending, setCatalogPending] = useState(false);

    async function fetchFilters() {
        try {
            const [musclesData, regionsData] = await Promise.all([
                getMuscles(),
                getMuscleRegions(),
            ]);

            setMuscles(musclesData);
            setRegions(regionsData);
        } catch (error: any) {
            if (error instanceof CatalogNotDownloadedError) {
                setCatalogPending(true);
                return;
            }
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to load filters.",
            });
        }
    }

    useEffect(() => {
        let cancelled = false;

        void getCatalogAvailability()
            .then((availability) => {
                if (!cancelled) {
                    setCatalogPending(availability === "pending");
                }
            })
            .catch((error) => {
                console.warn("[Catalog] Availability check failed:", error);
            });

        void fetchFilters();

        return () => {
            cancelled = true;
        };
    }, [catalogRevision]);

    const fetchExercises = useCallback(async () => {
        try {
            const data = await getExercisesByFilter({
                filterMode,
                selectedIds: selectedFilterIds,
            });

            setExercises(data);
        } catch (error: unknown) {
            if (error instanceof CatalogNotDownloadedError) {
                setCatalogPending(true);
                return;
            }

            showToast({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to load exercises.",
            });
        }
    }, [filterMode, selectedFilterIds, showToast]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises, catalogRevision]);

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
            <Text style={sharedStyles.screenTitle}>Exercises</Text>

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
                        title={
                            catalogPending
                                ? "Preparing exercise catalog"
                                : "No exercises found"
                        }
                        message={
                            catalogPending
                                ? "Exercises will appear after the first catalog download."
                                : "Try changing your search or filters."
                        }
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
