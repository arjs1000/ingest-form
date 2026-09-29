// Flow: the component library page renders every category of I* components without crashing,
// so a broken shared component shows up here first.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithRouter } from '@/core/testing/render-with-router';

import { ComponentLibrary } from '../components/component-library';

const CATEGORIES = ['Typography', 'Colours', 'Buttons', 'Forms', 'Feedback', 'Overlay', 'Navigation', 'Display', 'Layout'];

describe('ComponentLibrary', () => {
  it('renders every component category', async () => {
    renderWithRouter(<ComponentLibrary />);

    for (const category of CATEGORIES) {
      expect(await screen.findByRole('region', { name: category })).toBeInTheDocument();
    }
  });
});
