import { applyCatalogChanges, getCatalogSyncVersion } from "../database/catalogRepository";
import { notifyCatalogChanged } from "../sync/catalogEvents";

import { supabase } from "./supabase";

const PAGE_SIZE = 200;

type CatalogEntity = "exercises" | "muscles" | "muscle_regions" | "exercise_muscles";

type CatalogChange = {
    version: number;
    entity_type: CatalogEntity;
    entity_id: string;
    operation: "upsert" | "delete";
    payload: Record<string, unknown> | null;
};

export type CatalogSyncResult = {
    fromVersion: number;
    toVersion: number;
    changesApplied: number;
    pagesDownloaded: number;
};

let activeSync: Promise<CatalogSyncResult> | null = null;

export function syncCatalog(): Promise<CatalogSyncResult> {
    if (activeSync) return activeSync;

    const sync = performCatalogSync();
    activeSync = sync;

    void sync
        .finally(() => {
            if (activeSync === sync) {
                activeSync = null;
            }
        })
        .catch(() => {});

    return sync;
}

async function performCatalogSync(): Promise<CatalogSyncResult> {
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!userData.user) {
        throw new Error("Catalog sync requires authentication");
    }

    const fromVersion = await getCatalogSyncVersion();

    const { data: remoteVersion, error: versionError } = await supabase.rpc("get_catalog_version");

    if (versionError) throw versionError;

    const targetVersion = Number(remoteVersion);

    if (!Number.isSafeInteger(targetVersion) || targetVersion < 0) {
        throw new Error("Invalid remote catalog version");
    }

    if (fromVersion > targetVersion) {
        throw new Error("Local catalog version is ahead of the server");
    }

    let cursor = fromVersion;
    let changesApplied = 0;
    let pagesDownloaded = 0;

    while (cursor < targetVersion) {
        const { data, error } = await supabase.rpc("get_catalog_changes", {
            p_after_version: cursor,
            p_limit: PAGE_SIZE,
        });

        if (error) throw error;

        const changes = (data ?? []) as CatalogChange[];

        if (!changes.length) {
            throw new Error("Catalog sync stopped before reaching target version");
        }

        // Never advance past the version captured at sync start.

        for (const change of changes) {
            if (!change || !Number.isSafeInteger(change.version) || change.version <= 0) {
                throw new Error("Catalog change versions are not contiguous");
            }
        }

        const page = changes.filter((change) => change.version <= targetVersion);

        if (!page.length) {
            throw new Error("Catalog sync returned no applicable changes");
        }

        let previousVersion = cursor;

        for (const change of page) {
            if (!Number.isSafeInteger(change.version) || change.version !== previousVersion + 1) {
                throw new Error("Catalog change versions are not contiguous");
            }

            previousVersion = change.version;
        }

        await applyCatalogChanges(page);

        cursor = await getCatalogSyncVersion();

        // The local cursor must match the last applied change.
        if (cursor !== previousVersion) {
            throw new Error("Catalog cursor did not advance correctly");
        }

        // Notify React only after the transaction and validation succeed.
        notifyCatalogChanged();

        changesApplied += page.length;
        pagesDownloaded += 1;

        console.log("[Catalog Sync] Progress:", {
            cursor,
            targetVersion,
            changesApplied,
        });
    }

    const result: CatalogSyncResult = {
        fromVersion,
        toVersion: cursor,
        changesApplied,
        pagesDownloaded,
    };

    console.log("[Catalog Sync] Completed:", result);

    return result;
}
