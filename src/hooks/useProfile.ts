import { useLanguage } from "../i18n/LanguageProvider";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
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
    const { showToast } = useToast();

    const [fullName, setFullName] = useState("");
    const [goal, setGoal] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [newWeight, setNewWeight] = useState("");
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) return;

        try {
            const profile = await getProfile(user.id);

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
    }, [user?.id, showToast, t]);

    useEffect(() => {
        fetchProfile();
        fetchWeightLogs();
    }, [fetchProfile, user?.id]);

    async function saveProfile() {
        if (!user?.id) return;

        try {
            await upsertProfile({
                userId: user.id,
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

    async function fetchWeightLogs() {
        try {
            const data = await getWeightLogs();
            setWeightLogs(data);
        } catch (error: any) {
            showToast({
                type: "error",
                message: error instanceof Error ? error.message : t("weightLogsLoadError"),
            });
        }
    }

    async function addWeightLog() {
        if (!user?.id || !newWeight.trim()) return;

        try {
            await createWeightLog({
                userId: user.id,
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
            await removeWeightLog(id);

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
