// Flow: an admin opens Admin → General, sees the saved upload settings, changes the size limit and saves it to the API.
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IToaster } from '@/core/components/IToaster';
import { renderWithRouter } from '@/core/testing/render-with-router';
import { stubApi } from '@/core/testing/stub-api';

import { IntakeSettingsForm } from '../components/intake-settings-form';

describe('IntakeSettingsForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the saved settings, and Save sends the change to the API and shows "Settings saved"', async () => {
    const user = userEvent.setup();
    const requests = stubApi({
      'GET /api/admin/settings/intake': { data: { acceptPhotos: false, maxFileSizeMb: 5 } },
      'PUT /api/admin/settings/intake': { data: { acceptPhotos: false, maxFileSizeMb: 25 } },
    });
    renderWithRouter(
      <>
        <IntakeSettingsForm />
        <IToaster />
      </>,
    );

    expect(await screen.findByLabelText('5 MB')).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Accept photos' })).not.toBeChecked();

    await user.click(screen.getByLabelText('25 MB'));
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(await screen.findByText('Settings saved')).toBeInTheDocument();
    expect(requests).toContain('PUT /api/admin/settings/intake');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });
});
