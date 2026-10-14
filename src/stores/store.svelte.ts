import * as v from "valibot";
import { capitalize, uniq } from "es-toolkit";
import { indexTable } from "../lucide";
import {
  DEFAULT_SETTINGS,
  IconSettingsSchema,
  type IconSettings,
} from "../settings";

interface CategorySelectAbstraction {
  value: string;
  label: string;
}

export const DEFAULT_CATEGORY: CategorySelectAbstraction = {
  label: "All categories",
  value: "all",
};

const categories: CategorySelectAbstraction[] = [
  DEFAULT_CATEGORY,
  ...uniq(indexTable.flatMap((it) => it.categories))
    .map((value) => ({
      value,
      label: capitalize(value.replaceAll("-", " ")),
    }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];

const SETTINGS_KEY = "penpot-lucide-icons:settings";

// localStorage may be unavailable (privacy settings, sandboxing), the plugin
// still has to work then, just without remembering the settings.
function loadSettings(): IconSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = v.safeParse(IconSettingsSchema, {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(raw),
      });
      if (parsed.success) return parsed.output;
    }
  } catch {
    // ignore
  }

  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: IconSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export interface Notice {
  kind: "success" | "error";
  text: string;
}

class GlobalStore {
  readonly categories = categories;
  currentTab = $state<string>("icons");
  currentCategory = $state<string>(DEFAULT_CATEGORY.value);
  search = $state("");
  settings = $state<IconSettings>(loadSettings());
  notice = $state<Notice | null>(null);
  lastInserted = $state<string | null>(null);

  #noticeTimeout: ReturnType<typeof setTimeout> | undefined;

  notify(notice: Notice) {
    this.notice = notice;
    clearTimeout(this.#noticeTimeout);
    this.#noticeTimeout = setTimeout(
      () => (this.notice = null),
      notice.kind === "error" ? 6000 : 2000,
    );
  }

  resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS };
  }
}

export const store = new GlobalStore();
