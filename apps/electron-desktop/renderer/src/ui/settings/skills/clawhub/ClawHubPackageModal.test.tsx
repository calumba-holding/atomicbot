// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@shared/kit", () => ({
  Modal: ({
    open,
    header,
    children,
  }: {
    open: boolean;
    header: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div>
        <h2>{header}</h2>
        {children}
      </div>
    ) : null,
  ActionButton: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("./ClawHubPackageModal.module.css", () => ({
  default: new Proxy({}, { get: (_target, prop) => String(prop) }),
}));

import { ClawHubPackageModal } from "./ClawHubPackageModal";

const detail = {
  slug: "calendar",
  displayName: "Calendar Skill",
  summary: "Manage calendar events",
  latestVersion: "1.2.3",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ownerHandle: "magos",
  owner: null,
  channel: "community",
  isOfficial: false,
  verificationTier: null,
  executesCode: false,
  capabilityTags: [],
  runtimeId: null,
  tags: {},
  compatibility: null,
  capabilities: null,
  verification: null,
};

describe("ClawHubPackageModal", () => {
  it("uses red Remove action for installed skills and hides installed badge", () => {
    const onInstall = vi.fn();
    const onRemove = vi.fn();

    render(
      <ClawHubPackageModal
        open={true}
        slug="calendar"
        detail={detail}
        loading={false}
        error={null}
        actionBusy={false}
        actionKind={null}
        installed={true}
        onClose={vi.fn()}
        onInstall={onInstall}
        onRemove={onRemove}
      />
    );

    const button = screen.getByRole("button", { name: "Remove" });
    expect(button.className).toContain("UiClawHubDangerAction");
    expect(screen.queryByText("installed")).toBeNull();

    fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledWith("calendar");
    expect(onInstall).not.toHaveBeenCalled();
  });
});
