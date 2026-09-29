// Flow: a patient's document details pre-fill the form, they submit, and they reach the
// confirmation with their reference. FilePond can't upload in jsdom (it needs canvas and object
// URLs), so the test calls the extract API itself, seeds the draft with the result and starts at
// the details step.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubApi } from '@/core/testing/stub-api';
import { routeTree } from '@/routeTree.gen';

import { extractDocument } from '../api/intake.api';
import { useIntakeDraftStore } from '../store/intake-draft.store';

const EXTRACTION = {
  documentType: 'carers-identification',
  extractor: 'stub',
  fields: {
    name: 'Alex Example',
    email: 'alex@example.com',
    gender: 'female',
    date_of_birth: '1984-03-15',
    mobile_number: '07123 456789',
    address: { address_line_1: '1 High Street', address_line_2: 'Leeds', postcode: 'ls11aa' },
  },
};

const RESULT = {
  submissionId: 'sub_1',
  status: 'completed',
  failedStep: null,
  issues: [],
  applicationReference: 'UIF-123456-2026',
};

afterEach(() => {
  vi.unstubAllGlobals();
  useIntakeDraftStore.getState().reset();
});

describe('patient intake flow', () => {
  it('submits the pre-filled details and shows the reference', async () => {
    const requests = stubApi({
      'POST /api/v1/intake/extract': { data: EXTRACTION },
      'POST /api/v1/intake': { data: RESULT },
    });
    const draft = useIntakeDraftStore.getState();
    draft.start();
    draft.setDocumentType('carers-identification');
    const file = new File(['%PDF-1.4'], 'carers-form.pdf', { type: 'application/pdf' });
    draft.setExtraction(await extractDocument({ file, documentType: 'carers-identification' }), file.name);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: ['/patient-upload/details'] }),
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router as never} />
      </QueryClientProvider>,
    );

    expect(await screen.findByLabelText('Last name')).toHaveValue('Example');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('heading', { name: 'Thanks for your submission' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('UIF-123456-2026')).toBeInTheDocument();
    expect(requests).toContain('POST /api/v1/intake');
  }, 10_000);
});
