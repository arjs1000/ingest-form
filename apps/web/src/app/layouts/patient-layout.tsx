import type { ReactNode } from 'react';

import { IFooter } from '@/core/components/IFooter';
import { IHeader } from '@/core/components/IHeader';
import { ApiStatus } from '@/features/health/components/api-status';

import { APP_SUBTITLE, APP_TITLE } from '../app-meta';

/** Patient surface: NHS consumer style. Header, main, footer. Pages render their own IBackBar and IContainer. */
export function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div data-surface="patient" className="flex min-h-dvh flex-col">
      <IHeader title={APP_TITLE} subtitle={APP_SUBTITLE} actions={<ApiStatus />} />
      <main id="main-content" className="flex flex-1 flex-col pb-12 md:pb-16">
        {children}
      </main>
      <IFooter
        brand={APP_TITLE}
        tagline="Ingest Form proof of concept"
        disclaimer={
          <p>
            This is a proof of concept. Use synthetic data only.
          </p>
        }
      />
    </div>
  );
}
