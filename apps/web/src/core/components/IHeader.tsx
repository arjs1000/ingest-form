import type { ReactNode } from 'react';

import { IContainer } from './IContainer';

export interface IHeaderProps {
  title: string;
  subtitle?: string[];
  /** Right-aligned slot (status pill, language, location). Wraps below the title on narrow screens. */
  actions?: ReactNode;
}

export function IHeader({ title, subtitle = [], actions }: IHeaderProps) {
  return (
    <header className="bg-brand pt-[env(safe-area-inset-top)] text-white">
      <IContainer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5 md:py-6">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-2xl font-semibold leading-tight md:text-[1.75rem]">{title}</p>
          {subtitle.map((line) => (
            <p key={line} className="text-sm leading-snug text-white/90 md:text-base">
              {line}
            </p>
          ))}
        </div>
        {actions ? <div className="flex max-w-full shrink items-center">{actions}</div> : null}
      </IContainer>
    </header>
  );
}
