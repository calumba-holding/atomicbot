import React from "react";
import { getDesktopApi } from "@ipc/desktopApi";

export type ClawHubSkillItem = {
  slug: string;
  displayName: string;
  summary?: string;
  latestVersion?: { version: string; createdAt: number } | null;
  createdAt: number;
  updatedAt: number;
  ownerHandle?: string | null;
  channel: string;
  isOfficial: boolean;
  verificationTier?: string | null;
  executesCode?: boolean;
  capabilityTags?: string[];
  runtimeId?: string | null;
};

export type ClawHubSkillPackageDetail = {
  slug: string;
  displayName: string;
  summary?: string;
  latestVersion?: string | null;
  createdAt: number;
  updatedAt: number;
  ownerHandle?: string | null;
  owner?: {
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
  channel: string;
  isOfficial: boolean;
  verificationTier?: string | null;
  executesCode?: boolean;
  capabilityTags?: string[];
  runtimeId?: string | null;
  tags?: Record<string, string>;
  compatibility?: {
    pluginApiRange?: string;
    builtWithOpenClawVersion?: string;
    minGatewayVersion?: string;
  } | null;
  capabilities?: {
    executesCode?: boolean;
    runtimeId?: string;
    capabilityTags?: string[];
    bundleFormat?: string;
    hostTargets?: string[];
    pluginKind?: string;
    channels?: string[];
    providers?: string[];
    hooks?: string[];
    bundledSkills?: string[];
  } | null;
  verification?: {
    tier?: string;
    scope?: string;
    summary?: string;
    sourceRepo?: string;
    sourceCommit?: string;
    hasProvenance?: boolean;
    scanStatus?: string;
  } | null;
};

export type UseClawHubSkillsResult = {
  skills: ClawHubSkillItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hideSuspicious: boolean;
  setHideSuspicious: (value: boolean) => void;
  refresh: () => void;
  loadSkillDetail: (slug: string) => Promise<ClawHubSkillPackageDetail>;
};

const DEBOUNCE_MS = 350;

export function useClawHubSkills(): UseClawHubSkillsResult {
  const [skills, setSkills] = React.useState<ClawHubSkillItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hideSuspicious, setHideSuspicious] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const api = getDesktopApi();
        const query = searchQuery.trim();

        if (query) {
          const result = await api.clawhubSearchSkills({
            query,
            limit: 50,
            nonSuspicious: hideSuspicious,
          });
          if (cancelled) return;
          if (!result.ok) {
            setError(result.error ?? "Search failed");
            setSkills([]);
            return;
          }
          setSkills(
            result.results.map((r) => ({
              slug: r.slug,
              displayName: r.displayName,
              summary: r.summary,
              latestVersion: r.latestVersion,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              ownerHandle: r.ownerHandle,
              channel: r.channel,
              isOfficial: r.isOfficial,
              verificationTier: r.verificationTier,
              executesCode: r.executesCode,
              capabilityTags: r.capabilityTags,
              runtimeId: r.runtimeId,
            }))
          );
        } else {
          const result = await api.clawhubListSkills({
            limit: 50,
            nonSuspicious: hideSuspicious,
          });
          if (cancelled) return;
          if (!result.ok) {
            setError(result.error ?? "Failed to load skills");
            setSkills([]);
            return;
          }
          setSkills(
            result.items.map((item) => ({
              slug: item.slug,
              displayName: item.displayName,
              summary: item.summary,
              latestVersion: item.latestVersion,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              ownerHandle: item.ownerHandle,
              channel: item.channel,
              isOfficial: item.isOfficial,
              verificationTier: item.verificationTier,
              executesCode: item.executesCode,
              capabilityTags: item.capabilityTags,
              runtimeId: item.runtimeId,
            }))
          );
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setSkills([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim()) {
      debounceRef.current = setTimeout(() => void load(), DEBOUNCE_MS);
    } else {
      void load();
    }

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [hideSuspicious, searchQuery, refreshKey]);

  const loadSkillDetail = React.useCallback(async (slug: string) => {
    const api = getDesktopApi();
    const result = await api.clawhubGetSkillPackage({ slug });
    if (!result.ok || !result.package) {
      throw new Error(result.error ?? `Failed to load "${slug}"`);
    }
    return result.package;
  }, []);

  return {
    skills,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    hideSuspicious,
    setHideSuspicious,
    refresh,
    loadSkillDetail,
  };
}
