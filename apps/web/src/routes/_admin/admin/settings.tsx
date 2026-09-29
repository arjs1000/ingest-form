import { createFileRoute } from '@tanstack/react-router';

import { AdminSettingsPage } from '@/features/admin-settings/components/admin-settings-page';
import { settingsSearchSchema } from '@/features/admin-settings/schemas/settings-search.schema';

export const Route = createFileRoute('/_admin/admin/settings')({
  validateSearch: settingsSearchSchema,
  component: SettingsRoute,
});

// Maps URL state to props; the page itself knows nothing about the router.
function SettingsRoute() {
  const { tab, submission, status, source, failedStep, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters = { status, source, failedStep, page };

  return (
    <AdminSettingsPage
      tab={tab}
      // Switching tab drops the submission and filters: each tab starts clean.
      onTabChange={(next) => void navigate({ search: { tab: next } })}
      submissionId={submission}
      submissionFilters={filters}
      onSubmissionFiltersChange={(next) => void navigate({ search: { tab: 'ingested', ...next } })}
      // Keep the list filters, so "Back" returns to the same filtered page.
      onOpenSubmission={(id) =>
        void navigate({ search: { tab: 'ingested', submission: id, ...(tab === 'ingested' ? filters : {}) } })
      }
      onCloseSubmission={() => void navigate({ search: { tab: 'ingested', ...filters } })}
    />
  );
}
