// Flow: the home page is the entry point to the patient upload and admin settings journeys.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/core/testing/render-with-router';

import { HomePage } from '../components/home-page';

describe('HomePage', () => {
  it('links to patient upload and admin settings', async () => {
    renderWithRouter(<HomePage />);

    expect(await screen.findByRole('link', { name: 'Patient document upload' })).toHaveAttribute('href', '/patient-upload');
    expect(screen.getByRole('link', { name: 'Admin medical settings' })).toHaveAttribute('href', '/admin/settings');
  });
});
