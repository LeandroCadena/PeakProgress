import { RouteProp, useRoute } from "@react-navigation/native";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";

import AppButton from "../components/common/AppButton";
import AppInput from "../components/common/AppInput";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import SectionTitle from "../components/common/SectionTitle";
import ExerciseListCard from "../components/exercise/ExerciseListCard";
import { useExercisePicker } from "../hooks/useExercisePicker";
import { colors, componentStyles, spacing, typography } from "../theme";

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
    const { mode, routineId, sessionId, currentCount, currentExerciseIds } = route.params;

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
        <ScreenContainer contentStyle={styles.screenContent}>
            <Text style={styles.title}>Add Exercise</Text>

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
                                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                                    {item.name}
                                </Text>
                            </Pressable>
                        );
                    }}
                />
            </View>

            <SectionTitle>Exercises</SectionTitle>

            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.exerciseList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
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
                )}
                ListEmptyComponent={
                    <EmptyStateCard
                        title="No exercises found"
                        message="Try changing your search or filters."
                    />
                }
            />

            <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
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
        height: 38,
        justifyContent: "center",
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
