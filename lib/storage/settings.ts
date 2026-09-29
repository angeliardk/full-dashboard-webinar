import type { DashboardSettings } from "@/types/webinar";

const KEY = "webinar-dashboard-settings";

const DEFAULTS: DashboardSettings = {
  selectedWebinarId: null,
  selectedTab: "overview",
  editMode: false,
};

/** Small UI preferences only — never dataset rows. See indexeddb-repository.ts for data. */
export function loadSettings(): DashboardSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(partial: Partial<DashboardSettings>): DashboardSettings {
  const next = { ...loadSettings(), ...partial };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}
