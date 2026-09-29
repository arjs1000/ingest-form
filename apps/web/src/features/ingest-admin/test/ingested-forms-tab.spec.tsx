// Flow: an admin opens a failed submission, sees why the step failed, and re-runs it.
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/core/testing/render-with-router';
import { stubApi } from '@/core/testing/stub-api';

import { IngestedFormsTab } from '../components/ingested-forms-tab';
import { FAILED_AT_GEOCODE } from './fixtures';

describe('IngestedFormsTab', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the failed step's issue and re-runs the submission from that step", async () => {
    const user = userEvent.setup();
    const requests = stubApi({
      'GET /api/admin/submissions/sub_failed': { data: FAILED_AT_GEOCODE },
      'POST /api/admin/submissions/sub_failed/rerun': {
        data: { submissionId: 'sub_failed', status: 'completed', failedStep: null, issues: [] },
      },
    });
    renderWithRouter(
      <IngestedFormsTab
        submissionId="sub_failed"
        filters={{}}
        onFiltersChange={() => undefined}
        onOpenSubmission={() => undefined}
        onCloseSubmission={() => undefined}
      />,
    );

    const geocodeStep = await screen.findByRole('listitem', { name: 'Geocode step' });
    expect(within(geocodeStep).getByText('Postcode not found')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Re-run from Geocode' }));

    await vi.waitFor(() => expect(requests).toContain('POST /api/admin/submissions/sub_failed/rerun'));
  });
});
