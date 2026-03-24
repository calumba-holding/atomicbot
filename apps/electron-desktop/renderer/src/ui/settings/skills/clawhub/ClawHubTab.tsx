import React from "react";
import { getDesktopApiOrNull } from "@ipc/desktopApi";
import { CheckboxRow, SelectDropdown, TextInput } from "@shared/kit";
import { addToast, addToastError } from "@shared/toast";
import { useClawHubSkills } from "./useClawHubSkills";
import { ClawHubGrid } from "./ClawHubGrid";
import { ClawHubPackageModal } from "./ClawHubPackageModal";
import type { GatewayRpc } from "../skillDefinitions";

type SortMode = "updated-desc" | "created-desc" | "name-asc";
type SkillActionKind = "install" | "remove" | null;

export function ClawHubTab(props: {
  gw: GatewayRpc;
  installedSkillDirs: string[];
  onInstalledSkillsChanged: () => Promise<void> | void;
}) {
  const {
    skills,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    hideSuspicious,
    setHideSuspicious,
    loadSkillDetail,
  } = useClawHubSkills();
  const [actionSlug, setActionSlug] = React.useState<string | null>(null);
  const [actionKind, setActionKind] = React.useState<SkillActionKind>(null);
  const [sortMode, setSortMode] = React.useState<SortMode>("name-asc");
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<Awaited<ReturnType<typeof loadSkillDetail>> | null>(
    null
  );

  const handleInstall = React.useCallback(
    async (slug: string) => {
      setActionSlug(slug);
      setActionKind("install");
      try {
        await props.gw.request("skills.install", {
          source: "clawhub",
          slug,
        });
        addToast(`Installed "${slug}" from ClawHub`);
        await props.onInstalledSkillsChanged();
      } catch (err) {
        addToastError(err instanceof Error ? err.message : `Failed to install "${slug}"`);
      } finally {
        setActionSlug(null);
        setActionKind(null);
      }
    },
    [props]
  );

  const handleRemove = React.useCallback(
    async (slug: string) => {
      const api = getDesktopApiOrNull();
      if (!api?.removeCustomSkill) {
        addToastError("Remove skill is not available in this build");
        return;
      }
      setActionSlug(slug);
      setActionKind("remove");
      try {
        const result = await api.removeCustomSkill(slug);
        if (!result.ok) {
          throw new Error(result.error ?? `Failed to remove "${slug}"`);
        }
        addToast(`Removed "${slug}"`);
        await props.onInstalledSkillsChanged();
      } catch (err) {
        addToastError(err instanceof Error ? err.message : `Failed to remove "${slug}"`);
      } finally {
        setActionSlug(null);
        setActionKind(null);
      }
    },
    [props]
  );

  const installedSlugs = React.useMemo(
    () => new Set(props.installedSkillDirs),
    [props.installedSkillDirs]
  );

  const filteredSkills = React.useMemo(() => {
    const next = [...skills];

    next.sort((left, right) => {
      if (sortMode === "name-asc") {
        return left.displayName.localeCompare(right.displayName);
      }
      if (sortMode === "created-desc") {
        return right.createdAt - left.createdAt;
      }
      return right.updatedAt - left.updatedAt;
    });

    return next;
  }, [skills, sortMode]);

  const handleOpenDetails = React.useCallback(
    async (slug: string) => {
      setActiveSlug(slug);
      setDetailLoading(true);
      setDetailError(null);
      try {
        const nextDetail = await loadSkillDetail(slug);
        setDetail(nextDetail);
      } catch (err) {
        setDetail(null);
        setDetailError(err instanceof Error ? err.message : String(err));
      } finally {
        setDetailLoading(false);
      }
    },
    [loadSkillDetail]
  );

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 220px",
          gap: 12,
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <div className="UiInputRow" style={{ marginBottom: 0 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted2)",
              marginBottom: 6,
            }}
          >
            Filter
          </div>
          <TextInput
            type="text"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search ClawHub skills…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            isSearch={true}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted2)",
              marginBottom: 6,
            }}
          >
            Sort
          </div>
          <SelectDropdown<SortMode>
            value={sortMode}
            onChange={setSortMode}
            options={[
              { value: "updated-desc", label: "Recently updated" },
              { value: "created-desc", label: "Newest" },
              { value: "name-asc", label: "Name" },
            ]}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <CheckboxRow checked={hideSuspicious} onChange={setHideSuspicious}>
          Hide suspicious
        </CheckboxRow>
      </div>

      <ClawHubGrid
        skills={filteredSkills}
        loading={loading}
        error={error}
        actionSlug={actionSlug}
        actionKind={actionKind}
        installedSlugs={installedSlugs}
        onInstall={(slug) => void handleInstall(slug)}
        onRemove={(slug) => void handleRemove(slug)}
        onOpenDetails={(slug) => void handleOpenDetails(slug)}
        emptyStateText="No ClawHub packages match the current filters"
        emptyStateSubtext="Try clearing filters or changing the search query."
      />

      <ClawHubPackageModal
        open={activeSlug !== null}
        slug={activeSlug}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        actionBusy={actionSlug === activeSlug}
        actionKind={actionKind}
        installed={activeSlug !== null && installedSlugs.has(activeSlug)}
        onClose={() => {
          setActiveSlug(null);
          setDetail(null);
          setDetailError(null);
          setDetailLoading(false);
        }}
        onInstall={(slug) => void handleInstall(slug)}
        onRemove={(slug) => void handleRemove(slug)}
      />
    </>
  );
}
