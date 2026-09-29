import { ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';

import { IContainer } from './IContainer';

export interface IFooterLink {
  label: string;
  href: string;
}

export interface IFooterProps {
  brand: string;
  tagline?: string;
  links?: IFooterLink[];
  /** Safety / legal text. Required on patient-facing pages. */
  disclaimer: ReactNode;
}

export function IFooter({ brand, tagline, links = [], disclaimer }: IFooterProps) {
  return (
    <footer className="mt-auto border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <IContainer className="flex flex-col gap-6 py-8 md:py-12">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-control bg-brand text-white">
            <ClipboardList aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="font-semibold leading-tight">{brand}</p>
            {tagline ? <p className="text-sm text-text-secondary md:text-base">{tagline}</p> : null}
          </div>
        </div>
        <div className="border-t border-border pt-6 text-sm text-text-secondary md:text-base">{disclaimer}</div>
        {links.length > 0 ? (
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:text-base">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-text visited:text-text focus-visible:text-text">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </IContainer>
    </footer>
  );
}
