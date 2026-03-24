// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("./ClawHubGrid.module.css", () => ({
  default: new Proxy({}, { get: (_target, prop) => String(prop) }),
}));

import { ClawHubGrid } from "./ClawHubGrid";

const skill = {
  slug: "calendar",
  displayName: "Calendar Skill",
  summary: "Manage calendar events",
  latestVersion: { version: "1.2.3", createdAt: Date.now() },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ownerHandle: "magos",
  channel: "community",
  isOfficial: false,
  verificationTier: null,
  executesCode: false,
  capabilityTags: [],
  runtimeId: null,
};

describe("ClawHubGrid", () => {
  it("shows Remove for installed skills without installed badge", () => {
    const onInstall = vi.fn();
    const onRemove = vi.fn();

    render(
      <ClawHubGrid
        skills={[skill]}
        loading={false}
        error={null}
        actionSlug={null}
        actionKind={null}
        installedSlugs={new Set(["calendar"])}
        onInstall={onInstall}
        onRemove={onRemove}
        onOpenDetails={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: "Remove" });
    expect(button.className).toContain("UiClawHubInstallBtn--danger");
    expect(screen.queryByText("installed")).toBeNull();

    fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledWith("calendar");
    expect(onInstall).not.toHaveBeenCalled();
  });
});
