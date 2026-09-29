// Flow: the header pill tells the user whether the API is reachable, and why not when it is down.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubApi } from '@/core/testing/stub-api';

import { ApiStatus } from '../components/api-status';

function renderApiStatus() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ApiStatus />
    </QueryClientProvider>,
  );
}

describe('ApiStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows "API OK" when the API is healthy', async () => {
    stubApi({ 'GET /api/health': { data: { status: 'ok' } } });

    renderApiStatus();

    expect(await screen.findByText('API OK')).toBeInTheDocument();
  });

  it('shows "API offline" with the reason when the API is unreachable', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });

    renderApiStatus();

    expect(await screen.findByText('API offline')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No response from API');
  });
});
