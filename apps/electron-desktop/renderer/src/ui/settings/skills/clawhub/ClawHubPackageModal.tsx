import React from "react";
import { ActionButton, Modal } from "@shared/kit";
import type { ClawHubSkillPackageDetail } from "./useClawHubSkills";
import s from "./ClawHubPackageModal.module.css";

function formatDate(timestamp: number) {
  if (!timestamp) {
    return "Unknown";
  }
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return "Unknown";
  }
}

function formatList(values?: string[]) {
  if (!values || values.length === 0) {
    return "None";
  }
  return values.join(", ");
}

export function ClawHubPackageModal(props: {
  open: boolean;
  slug: string | null;
  detail: ClawHubSkillPackageDetail | null;
  loading: boolean;
  error: string | null;
  actionBusy: boolean;
  actionKind: "install" | "remove" | null;
  installed: boolean;
  onClose: () => void;
  onInstall: (slug: string) => void;
  onRemove: (slug: string) => void;
}) {
  const {
    open,
    slug,
    detail,
    loading,
    error,
    actionBusy,
    actionKind,
    installed,
    onClose,
    onInstall,
    onRemove,
  } = props;
  const ownerLabel =
    detail?.owner?.displayName || detail?.owner?.handle || detail?.ownerHandle || "Unknown";
  const [ownerImageFailed, setOwnerImageFailed] = React.useState(false);

  React.useEffect(() => {
    setOwnerImageFailed(false);
  }, [detail?.owner?.image, slug, open]);

  const ownerImageUrl = detail?.owner?.image && !ownerImageFailed ? detail.owner.image : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={detail?.displayName ?? "ClawHub package"}
      aria-label="ClawHub package details"
    >
      {loading ? <div className={s.UiClawHubLoading}>Loading package details…</div> : null}
      {!loading && error ? <div className={s.UiClawHubError}>{error}</div> : null}
      {!loading && !error && detail ? (
        <div className={s.UiClawHubModalBody}>
          <div className={s.UiClawHubModalHeader}>
            {ownerImageUrl ? (
              <img
                src={ownerImageUrl}
                alt=""
                className={s.UiClawHubOwnerImage}
                referrerPolicy="no-referrer"
                onError={() => setOwnerImageFailed(true)}
              />
            ) : (
              <div className={s.UiClawHubOwnerFallback} aria-hidden="true">
                {(ownerLabel[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className={s.UiClawHubOwnerMeta}>
              <div>{ownerLabel}</div>
              <div className={s.UiClawHubOwnerSubtext}>{detail.slug}</div>
            </div>
          </div>

          {detail.summary ? <div className={s.UiClawHubModalSummary}>{detail.summary}</div> : null}

          <div className={s.UiClawHubBadgeRow}>
            <span className={s.UiClawHubBadge}>{detail.channel}</span>
            {detail.isOfficial ? <span className={s.UiClawHubBadge}>official</span> : null}
            {detail.latestVersion ? (
              <span className={s.UiClawHubBadge}>v{detail.latestVersion}</span>
            ) : null}
            {detail.verification?.tier || detail.verificationTier ? (
              <span className={s.UiClawHubBadge}>
                verified: {detail.verification?.tier ?? detail.verificationTier}
              </span>
            ) : null}
            {detail.executesCode || detail.capabilities?.executesCode ? (
              <span className={s.UiClawHubBadge}>executes code</span>
            ) : null}
          </div>

          <div className={s.UiClawHubSection}>
            <div className={s.UiClawHubSectionTitle}>Package info</div>
            <div className={s.UiClawHubKeyValue}>
              <div className={s.UiClawHubKey}>Updated</div>
              <div className={s.UiClawHubValue}>{formatDate(detail.updatedAt)}</div>
              <div className={s.UiClawHubKey}>Created</div>
              <div className={s.UiClawHubValue}>{formatDate(detail.createdAt)}</div>
              <div className={s.UiClawHubKey}>Runtime</div>
              <div className={s.UiClawHubValue}>
                {detail.runtimeId ?? detail.capabilities?.runtimeId ?? "None"}
              </div>
              <div className={s.UiClawHubKey}>Capability tags</div>
              <div className={s.UiClawHubValue}>
                {formatList(detail.capabilityTags ?? detail.capabilities?.capabilityTags)}
              </div>
            </div>
          </div>

          {detail.tags && Object.keys(detail.tags).length > 0 ? (
            <div className={s.UiClawHubSection}>
              <div className={s.UiClawHubSectionTitle}>Tags</div>
              <div className={s.UiClawHubTagList}>
                {Object.entries(detail.tags).map(([key, value]) => (
                  <span key={key} className={s.UiClawHubTag}>
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {detail.compatibility ? (
            <div className={s.UiClawHubSection}>
              <div className={s.UiClawHubSectionTitle}>Compatibility</div>
              <div className={s.UiClawHubKeyValue}>
                <div className={s.UiClawHubKey}>Plugin API</div>
                <div className={s.UiClawHubValue}>
                  {detail.compatibility.pluginApiRange ?? "Unknown"}
                </div>
                <div className={s.UiClawHubKey}>Built with OpenClaw</div>
                <div className={s.UiClawHubValue}>
                  {detail.compatibility.builtWithOpenClawVersion ?? "Unknown"}
                </div>
                <div className={s.UiClawHubKey}>Min gateway</div>
                <div className={s.UiClawHubValue}>
                  {detail.compatibility.minGatewayVersion ?? "Unknown"}
                </div>
              </div>
            </div>
          ) : null}

          {detail.capabilities ? (
            <div className={s.UiClawHubSection}>
              <div className={s.UiClawHubSectionTitle}>Capabilities</div>
              <div className={s.UiClawHubKeyValue}>
                <div className={s.UiClawHubKey}>Providers</div>
                <div className={s.UiClawHubValue}>{formatList(detail.capabilities.providers)}</div>
                <div className={s.UiClawHubKey}>Hooks</div>
                <div className={s.UiClawHubValue}>{formatList(detail.capabilities.hooks)}</div>
                <div className={s.UiClawHubKey}>Host targets</div>
                <div className={s.UiClawHubValue}>
                  {formatList(detail.capabilities.hostTargets)}
                </div>
                <div className={s.UiClawHubKey}>Bundled skills</div>
                <div className={s.UiClawHubValue}>
                  {formatList(detail.capabilities.bundledSkills)}
                </div>
              </div>
            </div>
          ) : null}

          {detail.verification ? (
            <div className={s.UiClawHubSection}>
              <div className={s.UiClawHubSectionTitle}>Verification</div>
              <div className={s.UiClawHubKeyValue}>
                <div className={s.UiClawHubKey}>Summary</div>
                <div className={s.UiClawHubValue}>{detail.verification.summary ?? "None"}</div>
                <div className={s.UiClawHubKey}>Scope</div>
                <div className={s.UiClawHubValue}>{detail.verification.scope ?? "Unknown"}</div>
                <div className={s.UiClawHubKey}>Scan status</div>
                <div className={s.UiClawHubValue}>
                  {detail.verification.scanStatus ?? "Unknown"}
                </div>
                <div className={s.UiClawHubKey}>Source repo</div>
                <div className={s.UiClawHubValue}>
                  {detail.verification.sourceRepo ?? "Unknown"}
                </div>
                <div className={s.UiClawHubKey}>Source commit</div>
                <div className={s.UiClawHubValue}>
                  {detail.verification.sourceCommit ?? "Unknown"}
                </div>
              </div>
            </div>
          ) : null}

          <div className={s.UiClawHubActions}>
            <ActionButton
              variant="primary"
              className={installed ? s.UiClawHubDangerAction : ""}
              loading={actionBusy}
              disabled={!slug}
              onClick={() => {
                if (slug) {
                  if (installed) {
                    onRemove(slug);
                    return;
                  }
                  onInstall(slug);
                }
              }}
            >
              {actionBusy
                ? actionKind === "remove"
                  ? "Removing"
                  : "Installing"
                : installed
                  ? "Remove"
                  : "Install"}
            </ActionButton>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
