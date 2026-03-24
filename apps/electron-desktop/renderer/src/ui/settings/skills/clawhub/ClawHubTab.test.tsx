// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockGetDesktopApiOrNull = vi.fn();
const mockAddToast = vi.fn();
const mockAddToastError = vi.fn();
const mockLoadSkillDetail = vi.fn();
const mockSetSearchQuery = vi.fn();
const mockSetHideSuspicious = vi.fn();
const mockUseClawHubSkills = vi.fn();

vi.mock("@ipc/desktopApi", () => ({
  getDesktopApiOrNull: () => mockGetDesktopApiOrNull(),
}));

vi.mock("@shared/toast", () => ({
  addToast: (message: string) => mockAddToast(message),
  addToastError: (message: string) => mockAddToastError(message),
}));

vi.mock("@shared/kit", () => ({
  TextInput: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <input
      aria-label={placeholder ?? "text-input"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  CheckboxRow: ({
    checked,
    onChange,
    children,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: React.ReactNode;
  }) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  ),
  SelectDropdown: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <select aria-label="Sort" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  ActionButton: ({
    children,
    onClick,
    className,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
  }) => (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("./ClawHubGrid.module.css", () => ({
  default: new Proxy({}, { get: (_target, prop) => String(prop) }),
}));

vi.mock("./ClawHubPackageModal.module.css", () => ({
  default: new Proxy({}, { get: (_target, prop) => String(prop) }),
}));

vi.mock("./useClawHubSkills", () => ({
  useClawHubSkills: () => mockUseClawHubSkills(),
}));

import { ClawHubTab } from "./ClawHubTab";

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

describe("ClawHubTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadSkillDetail.mockResolvedValue(null);
    mockUseClawHubSkills.mockReturnValue({
      skills: [skill],
      loading: false,
      error: null,
      searchQuery: "",
      setSearchQuery: mockSetSearchQuery,
      hideSuspicious: true,
      setHideSuspicious: mockSetHideSuspicious,
      loadSkillDetail: mockLoadSkillDetail,
    });
  });

  it("installs a skill and requests installed list sync", async () => {
    const request = vi.fn().mockResolvedValue({});
    const onInstalledSkillsChanged = vi.fn().mockResolvedValue(undefined);

    mockGetDesktopApiOrNull.mockReturnValue({
      removeCustomSkill: vi.fn(),
    });

    render(
      <ClawHubTab
        gw={{ request }}
        installedSkillDirs={[]}
        onInstalledSkillsChanged={onInstalledSkillsChanged}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Install" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("skills.install", {
        source: "clawhub",
        slug: "calendar",
      })
    );
    expect(onInstalledSkillsChanged).toHaveBeenCalledOnce();
    expect(mockAddToast).toHaveBeenCalledWith('Installed "calendar" from ClawHub');
  });

  it("removes an installed skill and requests installed list sync", async () => {
    const removeCustomSkill = vi.fn().mockResolvedValue({ ok: true });
    const onInstalledSkillsChanged = vi.fn().mockResolvedValue(undefined);

    mockGetDesktopApiOrNull.mockReturnValue({
      removeCustomSkill,
    });

    render(
      <ClawHubTab
        gw={{ request: vi.fn() }}
        installedSkillDirs={["calendar"]}
        onInstalledSkillsChanged={onInstalledSkillsChanged}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(removeCustomSkill).toHaveBeenCalledWith("calendar"));
    expect(onInstalledSkillsChanged).toHaveBeenCalledOnce();
    expect(mockAddToast).toHaveBeenCalledWith('Removed "calendar"');
  });
});
