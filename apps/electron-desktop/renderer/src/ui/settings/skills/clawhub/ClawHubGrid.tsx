import type { ClawHubSkillItem } from "./useClawHubSkills";
import s from "./ClawHubGrid.module.css";

function formatDate(timestamp: number) {
  if (!timestamp) {
    return null;
  }
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return null;
  }
}

export function ClawHubGrid(props: {
  skills: ClawHubSkillItem[];
  loading: boolean;
  error: string | null;
  actionSlug: string | null;
  actionKind: "install" | "remove" | null;
  installedSlugs: Set<string>;
  onInstall: (slug: string) => void;
  onRemove: (slug: string) => void;
  onOpenDetails: (slug: string) => void;
  emptyStateText?: string;
  emptyStateSubtext?: string;
}) {
  const {
    skills,
    loading,
    error,
    actionSlug,
    actionKind,
    installedSlugs,
    onInstall,
    onRemove,
    onOpenDetails,
  } = props;

  if (loading && skills.length === 0) {
    return <div className={s.UiClawHubLoading}>Loading skills from ClawHub…</div>;
  }

  if (error && skills.length === 0) {
    return <div className={s.UiClawHubError}>{error}</div>;
  }

  if (skills.length === 0) {
    return (
      <div className={s.UiClawHubEmpty}>
        <div className={s.UiClawHubEmptyText}>
          {props.emptyStateText ?? "No skills available on ClawHub"}
        </div>
        <div className={s.UiClawHubEmptySubtext}>
          {props.emptyStateSubtext ?? "Skills published to ClawHub will appear here."}
        </div>
      </div>
    );
  }

  return (
    <div className="UiSkillsScroll" style={{ maxHeight: "none" }}>
      <div className="UiSkillsGrid">
        {skills.map((skill) => {
          const version = skill.latestVersion?.version;
          const installed = installedSlugs.has(skill.slug);
          const busy = actionSlug === skill.slug;
          const updatedAt = formatDate(skill.updatedAt);

          return (
            <div
              key={skill.slug}
              className={`UiSkillCard ${s.UiClawHubCard}`}
              role="button"
              tabIndex={0}
              aria-label={skill.displayName}
              onClick={() => onOpenDetails(skill.slug)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenDetails(skill.slug);
                }
              }}
            >
              <div className="UiSkillTopRow">
                <span
                  className="UiSkillIcon"
                  aria-hidden="true"
                  style={{
                    background: "var(--surface-overlay-subtle)",
                    width: 26,
                    height: 26,
                    fontSize: 14,
                  }}
                >
                  🦞
                </span>
                <div className={s.UiClawHubCardHeader}>
                  <div className={s.UiClawHubTitle}>{skill.displayName}</div>
                  <div className={s.UiClawHubOwnerText}>
                    {skill.ownerHandle ? `by ${skill.ownerHandle}` : "Community package"}
                  </div>
                </div>
                <div className={s.UiClawHubCardMeta}>
                  <button
                    type="button"
                    className={`${s.UiClawHubInstallBtn}${installed ? ` ${s["UiClawHubInstallBtn--danger"]}` : ""}`}
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (installed) {
                        onRemove(skill.slug);
                        return;
                      }
                      onInstall(skill.slug);
                    }}
                  >
                    {busy
                      ? actionKind === "remove"
                        ? "Removing…"
                        : "Installing…"
                      : installed
                        ? "Remove"
                        : "Install"}
                  </button>
                </div>
              </div>
              <div className={s.UiClawHubDescription}>{skill.summary ?? ""}</div>
              <div className={s.UiClawHubMetaLine}>
                {version ? <span className={s.UiClawHubVersionBadge}>v{version}</span> : null}
                <span
                  className={`${s.UiClawHubBadge} ${s[`UiClawHubBadge--${skill.channel}`] ?? s["UiClawHubBadge--community"]}`}
                >
                  {skill.channel}
                </span>
                {skill.isOfficial ? (
                  <span className={`${s.UiClawHubBadge} ${s["UiClawHubBadge--official"]}`}>
                    official
                  </span>
                ) : null}
                {skill.verificationTier ? (
                  <span className={`${s.UiClawHubBadge} ${s["UiClawHubBadge--verified"]}`}>
                    {skill.verificationTier}
                  </span>
                ) : null}
                {skill.executesCode ? (
                  <span className={`${s.UiClawHubBadge} ${s["UiClawHubBadge--code"]}`}>
                    executes code
                  </span>
                ) : null}
                {updatedAt ? (
                  <span className={s.UiClawHubMetaText}>updated {updatedAt}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
