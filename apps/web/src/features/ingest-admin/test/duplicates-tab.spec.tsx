// Flow: an admin reviews submissions that look like the same person (same name + email or mobile)
// or the same application. The page shows why each matched and their IDs for manual clean-up,
// but never offers a delete button.
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/core/testing/render-with-router';
import { stubApi } from '@/core/testing/stub-api';

import { DuplicatesTab } from '../components/duplicates-tab';
import { submissionSummary } from './fixtures';

const JOHN = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', mobileNumber: '+447123456789' };

describe('DuplicatesTab', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows why each submission matched, lists every ID, and has no delete button', async () => {
    stubApi({
      'GET /api/admin/submissions/duplicates': {
        data: [
          {
            key: 'sub_first',
            matchedOn: ['same_person_email'],
            submissions: [
              { ...submissionSummary({ id: 'sub_first' }), person: JOHN, matchReason: null },
              {
                ...submissionSummary({
                  id: 'sub_second',
                  source: 'ui',
                  providerName: null,
                  applicationReference: 'UIF-000001-2026',
                  duplicateOfId: 'sub_first',
                  duplicateReason: 'same_person_email',
                }),
                person: { ...JOHN, mobileNumber: '+447777777777' },
                matchReason: 'same_person_email',
              },
            ],
          },
        ],
      },
    });

    renderWithRouter(<DuplicatesTab onOpenSubmission={() => undefined} />);

    const table = await screen.findByRole('table', { name: 'Possible duplicate submissions for John Doe' });
    expect(within(table).getByText('sub_first')).toBeInTheDocument();
    expect(within(table).getByText('sub_second')).toBeInTheDocument();
    expect(within(table).getByText('First received')).toBeInTheDocument();
    expect(within(table).getByText('Same name and email')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete/i })).not.toBeInTheDocument();
  });
});
