// Flow: an admin opens Admin → General, sees the saved notification addresses and whether email is
// on, fixes an invalid address after the error summary flags it, and saves the change to the API.
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IToaster } from '@/core/components/IToaster';
import { renderWithRouter } from '@/core/testing/render-with-router';
import { stubApi } from '@/core/testing/stub-api';

import { NotificationSettingsForm } from '../components/notification-settings-form';

describe('NotificationSettingsForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the addresses, rejects an invalid one, and Save sends the change and shows "Notification settings saved"', async () => {
    const user = userEvent.setup();
    const requests = stubApi({
      'GET /api/admin/settings/notifications': {
        data: { successEmail: 'ops@example.test', failureEmail: null, emailConfigured: false },
      },
      'PUT /api/admin/settings/notifications': {
        data: { successEmail: 'ops@example.test', failureEmail: 'alerts@example.test', emailConfigured: false },
      },
    });
    renderWithRouter(
      <>
        <NotificationSettingsForm />
        <IToaster />
      </>,
    );

    expect(await screen.findByLabelText('Success email')).toHaveValue('ops@example.test');
    expect(screen.getByText('Email off')).toBeInTheDocument();

    const failureEmail = screen.getByLabelText('Failure email');
    await user.type(failureEmail, 'alerts');
    await user.click(screen.getByRole('button', { name: 'Save notifications' }));
    expect(await screen.findByText('There is a problem')).toBeInTheDocument();
    expect(requests).not.toContain('PUT /api/admin/settings/notifications');

    await user.type(failureEmail, '@example.test');
    await user.click(screen.getByRole('button', { name: 'Save notifications' }));

    expect(await screen.findByText('Notification settings saved')).toBeInTheDocument();
    expect(requests).toContain('PUT /api/admin/settings/notifications');
  });
});
