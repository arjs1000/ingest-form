import { Link } from '@tanstack/react-router';

import { IBreadcrumb, IBreadcrumbItem } from '@/core/components/IBreadcrumb';
import { IPageHeader } from '@/core/components/IPageHeader';
import { ITabs, ITabsContent, ITabsList, ITabsTrigger } from '@/core/components/ITabs';
import { ComponentLibrary } from '@/features/component-library/components/component-library';
import { DuplicatesTab } from '@/features/ingest-admin/components/duplicates-tab';
import { IngestedFormsTab, type IngestedFormsTabProps } from '@/features/ingest-admin/components/ingested-forms-tab';
import { ProvidersTab } from '@/features/providers-admin/components/providers-tab';

import { SETTINGS_TAB_ITEMS, SETTINGS_TABS, type SettingsTab } from '../constants';
import { IntakeSettingsForm } from './intake-settings-form';
import { NotificationSettingsForm } from './notification-settings-form';

type SubmissionFilters = IngestedFormsTabProps['filters'];

export interface AdminSettingsPageProps {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  /** Submission open in the "Ingested forms" detail view (`?submission=`). */
  submissionId?: string;
  /** "Ingested forms" list filters (`?status=&source=&failedStep=&page=`). */
  submissionFilters?: SubmissionFilters;
  onSubmissionFiltersChange?: (filters: SubmissionFilters) => void;
  /** Opens a submission's detail on the "Ingested forms" tab (from either submissions tab). */
  onOpenSubmission?: (id: string) => void;
  onCloseSubmission?: () => void;
}

const NO_FILTERS: SubmissionFilters = {};
const noop = () => undefined;

function isSettingsTab(value: string): value is SettingsTab {
  return (SETTINGS_TABS as readonly string[]).includes(value);
}

/** Router-agnostic: URL state comes in as props, changes go out as callbacks (see the settings route). */
export function AdminSettingsPage({
  tab,
  onTabChange,
  submissionId,
  submissionFilters = NO_FILTERS,
  onSubmissionFiltersChange = noop,
  onOpenSubmission = noop,
  onCloseSubmission = noop,
}: AdminSettingsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <IPageHeader
        title="Settings"
        description="Intake settings, third-party ingest, and the shared UI component library."
        eyebrow={
          <IBreadcrumb>
            <IBreadcrumbItem>
              <Link to="/admin/settings" search={{ tab: 'general' }}>
                Admin
              </Link>
            </IBreadcrumbItem>
            <IBreadcrumbItem current>Settings</IBreadcrumbItem>
          </IBreadcrumb>
        }
      />
      <ITabs value={tab} onValueChange={(value) => isSettingsTab(value) && onTabChange(value)}>
        <ITabsList aria-label="Settings sections">
          {SETTINGS_TAB_ITEMS.map((item) => (
            <ITabsTrigger key={item.tab} value={item.tab}>
              <item.icon aria-hidden="true" />
              {item.label}
            </ITabsTrigger>
          ))}
        </ITabsList>
        <ITabsContent value="general" className="flex max-w-3xl flex-col gap-10">
          <IntakeSettingsForm />
          <NotificationSettingsForm />
        </ITabsContent>
        <ITabsContent value="providers">
          <ProvidersTab />
        </ITabsContent>
        <ITabsContent value="ingested">
          <IngestedFormsTab
            submissionId={submissionId}
            filters={submissionFilters}
            onFiltersChange={onSubmissionFiltersChange}
            onOpenSubmission={onOpenSubmission}
            onCloseSubmission={onCloseSubmission}
          />
        </ITabsContent>
        <ITabsContent value="duplicates">
          <DuplicatesTab onOpenSubmission={onOpenSubmission} />
        </ITabsContent>
        <ITabsContent value="components">
          <ComponentLibrary />
        </ITabsContent>
      </ITabs>
    </div>
  );
}
