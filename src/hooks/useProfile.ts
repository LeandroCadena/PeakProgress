import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../i18n/LanguageProvider";
import {
    createWeightLog,
    getProfile,
    getWeightLogs,
    removeWeightLog,
    upsertProfile,
} from "../services/profileService";
import { WeightLog } from "../types/profile";

export function useProfile() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const userId = user.id;
    const { showToast } = useToast();

    const [fullName, setFullName] = useState("");
    const [goal, setGoal] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [newWeight, setNewWeight] = useState("");
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

    const fetchProfile = useCallback(async () => {
        try {
            const profile = await getProfile(userId);

            if (!profile) return;

            setFullName(profile.full_name ?? "");
            setGoal(profile.goal ?? "");
            setExperienceLevel(profile.experience_level ?? "");
            setHeightCm(profile.height_cm?.toString() ?? "");
            setWeightKg(profile.weight_kg?.toString() ?? "");
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("profileLoadError"),
            });
        }
    }, [userId, showToast, t]);

    async function saveProfile() {
        try {
            await upsertProfile({
                userId,
                fullName,
                goal,
                experienceLevel,
                heightCm,
                weightKg,
            });

            showToast({
                type: "success",
                message: t("profileUpdated"),
            });
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("profileSaveError"),
            });
        }
    }

    const fetchWeightLogs = useCallback(async () => {
        try {
            const data = await getWeightLogs(userId);
            setWeightLogs(data);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("weightLogsLoadError"),
            });
        }
    }, [userId, showToast, t]);

    useEffect(() => {
        void fetchProfile();
        void fetchWeightLogs();
    }, [fetchProfile, fetchWeightLogs]);

    async function addWeightLog() {
        if (!newWeight.trim()) return;

        try {
            await createWeightLog({
                userId,
                weightKg: Number(newWeight),
            });

            setNewWeight("");

            await fetchWeightLogs();
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("weightLogAddError"),
            });
        }
    }

    async function deleteWeightLog(id: string) {
        try {
            await removeWeightLog(id, userId);

            await fetchWeightLogs();
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("weightLogDeleteError"),
            });
        }
    }

    return {
        fullName,
        setFullName,

        goal,
        setGoal,

        experienceLevel,
        setExperienceLevel,

        heightCm,
        setHeightCm,

        weightKg,
        setWeightKg,

        newWeight,
        setNewWeight,

        weightLogs,

        saveProfile,
        addWeightLog,
        deleteWeightLog,
    };
}
