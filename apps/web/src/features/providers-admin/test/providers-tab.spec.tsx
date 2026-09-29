// Flow: an admin creates an API key for a provider and sees the full key once, in the dialog, to copy.
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/core/testing/render-with-router';
import { stubApi } from '@/core/testing/stub-api';

import { ProvidersTab } from '../components/providers-tab';

const FULL_KEY = 'ifk_0123456789abcdefghijklmnopqrstuv';

const PROVIDER_WITHOUT_KEYS = { id: 'prov_1', name: 'Acme Health', createdAt: '2026-09-01T09:00:00.000Z', keys: [] };

const CREATED_KEY = {
  key: FULL_KEY,
  apiKey: {
    id: 'key_1',
    prefix: 'ifk_01234567',
    label: null,
    status: 'active',
    createdAt: '2026-09-27T09:00:00.000Z',
    expiresAt: '2026-10-27T09:00:00.000Z',
    lastUsedAt: null,
    revokedAt: null,
  },
};

describe('ProvidersTab', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the full key once, in the dialog, after creating a key', async () => {
    const user = userEvent.setup();
    stubApi({
      'GET /api/admin/providers': { data: [PROVIDER_WITHOUT_KEYS] },
      'POST /api/admin/providers/prov_1/keys': { data: CREATED_KEY },
    });
    renderWithRouter(<ProvidersTab />);

    await user.click(await screen.findByRole('button', { name: 'Create key for Acme Health' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }));

    expect(await within(dialog).findByTestId('created-api-key')).toHaveTextContent(FULL_KEY);

    await user.click(within(dialog).getByRole('button', { name: 'I have copied the key' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText(FULL_KEY)).not.toBeInTheDocument();
  });
});
