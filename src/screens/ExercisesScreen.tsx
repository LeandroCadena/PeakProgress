import { matchesExerciseName } from "../i18n/exerciseText";
import { useLanguage } from "../i18n/LanguageProvider";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import AppDialog from "../components/common/AppDialog";
import AppInput from "../components/common/AppInput";
import EmptyStateCard from "../components/common/EmptyStateCard";
import ScreenContainer from "../components/common/ScreenContainer";
import ExerciseListCard from "../components/exercise/ExerciseListCard";
import { useToast } from "../context/ToastContext";
import { useCatalogNetworkStatus } from "../hooks/useCatalogNetworkStatus";
import { useCatalogRevision } from "../hooks/useCatalogRevision";
import { syncCatalog } from "../services/catalogSyncService";
import {
    CatalogNotDownloadedError,
    getCatalogAvailability,
    getExercisesByFilter,
    getMuscleRegions,
    getMuscles,
} from "../services/exerciseService";
import { componentStyles, spacing, typography, useAppTheme, createThemedStyles } from "../theme";
import { Exercise, FilterMode, Muscle, MuscleRegion } from "../types/exercise";

export default function ExercisesScreen({ navigation }: any) {
    const { language, t } = useLanguage();
    const { colors, sharedStyles } = useAppTheme();
    const styles = getStyles(colors);
    const { showToast } = useToast();
    const [search, setSearch] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("muscle");
    const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [regions, setRegions] = useState<MuscleRegion[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const catalogRevision = useCatalogRevision();
    const [catalogPending, setCatalogPending] = useState(true);
    const networkStatus = useCatalogNetworkStatus();
    const [manualSyncing, setManualSyncing] = useState(false);
    const [showCellularDialog, setShowCellularDialog] = useState(false);

    async function downloadCatalog() {
        if (manualSyncing) return;

        setManualSyncing(true);

        try {
            const result = await syncCatalog();

            showToast({
                type: "success",
                message: result.changesApplied > 0 ? t("catalogUpdated") : t("catalogUpToDate"),
            });
        } catch (error: unknown) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("catalogDownloadError"),
            });
        } finally {
            setManualSyncing(false);
        }
    }

    function requestCatalogDownload() {
        if (manualSyncing) return;

        if (networkStatus === "offline" || networkStatus === "checking") {
            showToast({
                type: "error",
                message: t("catalogInternetRequired"),
            });
            return;
        }

        if (networkStatus === "cellular") {
            setShowCellularDialog(true);
            return;
        }

        void downloadCatalog();
    }

    useEffect(() => {
        let cancelled = false;

        async function loadFilters() {
            try {
                const availability = await getCatalogAvailability();

                if (cancelled) return;

                if (availability === "pending") {
                    setCatalogPending(true);
                    setMuscles([]);
                    setRegions([]);
                    return;
                }

                const [musclesData, regionsData] = await Promise.all([
                    getMuscles(),
                    getMuscleRegions(),
                ]);

                if (cancelled) return;

                setMuscles(musclesData);
                setRegions(regionsData);
                setCatalogPending(false);
            } catch (error: unknown) {
                if (cancelled) return;

                if (error instanceof CatalogNotDownloadedError) {
                    setCatalogPending(true);
                    return;
                }

                showToast({
                    type: "error",
                    message: error instanceof Error ? error.message : t("filtersLoadError"),
                });
            }
        }

        void loadFilters();

        return () => {
            cancelled = true;
        };
    }, [catalogRevision, showToast, t]);

    useEffect(() => {
        let cancelled = false;

        async function loadExercises() {
            try {
                const data = await getExercisesByFilter({
                    filterMode,
                    selectedIds: selectedFilterIds,
                });

                if (cancelled) return;

                setExercises(data);
                setCatalogPending(false);
            } catch (error: unknown) {
                if (cancelled) return;

                if (error instanceof CatalogNotDownloadedError) {
                    setCatalogPending(true);
                    setExercises([]);
                    return;
                }

                showToast({
                    type: "error",
                    message: error instanceof Error ? error.message : t("exercisesLoadError"),
                });
            }
        }

        void loadExercises();

        return () => {
            cancelled = true;
        };
    }, [filterMode, selectedFilterIds, catalogRevision, showToast, t]);

    const filterOptions = filterMode === "muscle" ? muscles : regions;

    const filteredExercises = exercises.filter((exercise) =>
        matchesExerciseName(exercise, search, language)
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

    const catalogPendingMessage =
        networkStatus === "offline"
            ? t("catalogConnectWifi")
            : networkStatus === "cellular"
              ? t("catalogWaitingWifi")
              : networkStatus === "checking"
                ? t("catalogCheckingConnection")
                : networkStatus === "other"
                  ? t("catalogDownloadsOnWifi")
                  : t("catalogWaitingForDownload");

    return (
        <ScreenContainer contentStyle={styles.screenContent}>
            <Text style={sharedStyles.screenTitle}>{t("exercises")}</Text>

            {catalogPending && (
                <Pressable
                    style={styles.downloadButton}
                    onPress={requestCatalogDownload}
                    disabled={manualSyncing}
                >
                    <Text style={styles.downloadButtonText}>
                        {manualSyncing ? t("catalogDownloading") : t("downloadCatalog")}
                    </Text>
                </Pressable>
            )}

            <View style={styles.searchRow}>
                <AppInput
                    style={styles.searchInput}
                    placeholder={t("searchExercise")}
                    value={search}
                    onChangeText={setSearch}
                />

                <Pressable
                    style={styles.filterModeButton}
                    onPress={() => changeFilterMode(filterMode === "muscle" ? "region" : "muscle")}
                >
                    <Text style={styles.filterModeText}>
                        {filterMode === "muscle" ? t("muscle") : t("region")}
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
                        title={catalogPending ? t("catalogPreparing") : t("noExercisesFound")}
                        message={catalogPending ? catalogPendingMessage : t("changeExerciseSearch")}
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

            <AppDialog
                visible={showCellularDialog}
                title={t("useMobileData")}
                message={t("catalogMobileDataWarning")}
                confirmLabel={t("download")}
                cancelLabel={t("cancel")}
                variant="primary"
                onCancel={() => setShowCellularDialog(false)}
                onConfirm={async () => {
                    setShowCellularDialog(false);
                    await downloadCatalog();
                }}
            />
        </ScreenContainer>
    );
}

const getStyles = createThemedStyles((colors) => ({
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
    downloadButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: componentStyles.buttonRadius,
        alignItems: "center",
        marginBottom: spacing.md,
    },
    downloadButtonText: {
        color: colors.text,
        fontWeight: typography.weightBold,
    },
}));
