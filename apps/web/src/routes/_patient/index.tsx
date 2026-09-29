import { createFileRoute } from '@tanstack/react-router';

import { HomePage } from '@/features/home/components/home-page';

// Route files stay thin: they map a URL to a feature component and nothing else.
export const Route = createFileRoute('/_patient/')({
  component: HomePage,
});
