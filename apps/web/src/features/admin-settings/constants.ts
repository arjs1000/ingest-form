import { Files, Inbox, KeyRound, LayoutGrid, Settings, type LucideIcon } from 'lucide-react';

export const SETTINGS_TABS = ['general', 'providers', 'ingested', 'duplicates', 'components'] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export interface SettingsTabMeta {
  tab: SettingsTab;
  label: string;
  icon: LucideIcon;
}

/** Tab order, labels and icons. The admin sidebar and mobile menu render this same list. */
export const SETTINGS_TAB_ITEMS: readonly SettingsTabMeta[] = [
  { tab: 'general', label: 'General', icon: Settings },
  { tab: 'providers', label: 'API providers', icon: KeyRound },
  { tab: 'ingested', label: 'Ingested forms', icon: Inbox },
  { tab: 'duplicates', label: 'Duplicate submissions', icon: Files },
  { tab: 'components', label: 'UI component library', icon: LayoutGrid },
];
