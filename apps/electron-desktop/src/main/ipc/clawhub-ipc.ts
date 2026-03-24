import { ipcMain } from "electron";

import { IPC } from "../../shared/ipc-channels";

const CLAWHUB_BASE_URL = "https://clawhub.ai";
const FETCH_TIMEOUT_MS = 30_000;

type ClawHubPackageListItem = {
  name: string;
  displayName: string;
  family: string;
  channel: string;
  isOfficial: boolean;
  summary?: string;
  ownerHandle?: string | null;
  latestVersion?: string | null;
  createdAt: number;
  updatedAt: number;
  capabilityTags?: string[];
  executesCode?: boolean;
  verificationTier?: string | null;
  runtimeId?: string | null;
};

type ClawHubPackageSearchResult = {
  score: number;
  package: ClawHubPackageListItem;
};

type ClawHubSkillSearchResult = {
  score: number;
  slug: string;
  displayName: string;
  summary?: string;
  version?: string;
  updatedAt?: number;
};

type ClawHubPackageDetail = {
  package:
    | (ClawHubPackageListItem & {
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
      })
    | null;
  owner?: {
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
};

function mapPackageListItem(item: ClawHubPackageListItem) {
  return {
    slug: item.name,
    displayName: item.displayName,
    summary: item.summary,
    latestVersion: item.latestVersion
      ? { version: item.latestVersion, createdAt: item.updatedAt }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ownerHandle: item.ownerHandle,
    channel: item.channel,
    isOfficial: item.isOfficial,
    verificationTier: item.verificationTier,
    executesCode: item.executesCode,
    capabilityTags: item.capabilityTags ?? [],
    runtimeId: item.runtimeId,
  };
}

async function clawhubFetch<T>(
  path: string,
  search?: Record<string, string | undefined>
): Promise<T> {
  const url = new URL(path, CLAWHUB_BASE_URL);
  for (const [key, value] of Object.entries(search ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`ClawHub request timed out after ${FETCH_TIMEOUT_MS}ms`)),
    FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      throw new Error(`ClawHub ${path} failed (${response.status}): ${body}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function registerClawHubHandlers() {
  ipcMain.handle(
    IPC.clawhubListSkills,
    async (_evt, params?: { limit?: number; nonSuspicious?: boolean }) => {
      try {
        const result = await clawhubFetch<{
          items: ClawHubPackageListItem[];
          nextCursor?: string | null;
        }>("/api/v1/packages", {
          family: "skill",
          limit: params?.limit ? String(params.limit) : "50",
          nonSuspicious: params?.nonSuspicious ? "true" : undefined,
        });
        return {
          ok: true,
          items: result.items.map(mapPackageListItem),
        };
      } catch (err) {
        return { ok: false, items: [], error: String(err instanceof Error ? err.message : err) };
      }
    }
  );

  ipcMain.handle(
    IPC.clawhubSearchSkills,
    async (_evt, params: { query?: string; limit?: number; nonSuspicious?: boolean }) => {
      const query = typeof params?.query === "string" ? params.query.trim() : "";
      if (!query) {
        return { ok: false, results: [], error: "Search query is required" };
      }
      try {
        const result = await clawhubFetch<{
          results: ClawHubPackageSearchResult[] | ClawHubSkillSearchResult[];
        }>("/api/v1/packages/search", {
          q: query,
          family: "skill",
          limit: params?.limit ? String(params.limit) : "30",
          nonSuspicious: params?.nonSuspicious ? "true" : undefined,
        });
        return {
          ok: true,
          results: (result.results ?? []).map((item) => {
            if ("package" in item) {
              const pkg = (item as ClawHubPackageSearchResult).package;
              return mapPackageListItem(pkg);
            }
            const skill = item as ClawHubSkillSearchResult;
            return {
              slug: skill.slug,
              displayName: skill.displayName,
              summary: skill.summary,
              latestVersion: skill.version
                ? { version: skill.version, createdAt: skill.updatedAt ?? 0 }
                : null,
              createdAt: skill.updatedAt ?? 0,
              updatedAt: skill.updatedAt ?? 0,
              ownerHandle: null,
              channel: "community",
              isOfficial: false,
              verificationTier: null,
              executesCode: false,
              capabilityTags: [],
              runtimeId: null,
            };
          }),
        };
      } catch (err) {
        return { ok: false, results: [], error: String(err instanceof Error ? err.message : err) };
      }
    }
  );

  ipcMain.handle(IPC.clawhubGetSkillPackage, async (_evt, params: { slug?: string }) => {
    const slug = typeof params?.slug === "string" ? params.slug.trim() : "";
    if (!slug) {
      return { ok: false, error: "Package slug is required" };
    }
    try {
      const result = await clawhubFetch<ClawHubPackageDetail>(
        `/api/v1/packages/${encodeURIComponent(slug)}`
      );
      if (!result.package) {
        return { ok: false, error: `Package "${slug}" not found` };
      }
      const pkg = result.package;
      return {
        ok: true,
        package: {
          ...mapPackageListItem(pkg),
          latestVersion: pkg.latestVersion ?? null,
          owner: result.owner ?? null,
          tags: pkg.tags ?? {},
          compatibility: pkg.compatibility ?? null,
          capabilities: pkg.capabilities ?? null,
          verification: pkg.verification ?? null,
        },
      };
    } catch (err) {
      return { ok: false, error: String(err instanceof Error ? err.message : err) };
    }
  });
}
