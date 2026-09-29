import { Slot, Slottable } from '@radix-ui/react-slot';
import { ChevronLeft } from 'lucide-react';
import type { ReactElement } from 'react';

import { IContainer } from './IContainer';

export interface IBackBarProps {
  /** A single link element, e.g. `<Link to="/">Back</Link>`. */
  children: ReactElement;
}

/** Full-width lighter-blue bar under the header, holding one back link. */
export function IBackBar({ children }: IBackBarProps) {
  return (
    <nav aria-label="Back" className="bg-brand-bar">
      <IContainer className="flex min-h-12 items-center">
        <Slot className="inline-flex min-h-11 items-center gap-1 text-white no-underline visited:text-white hover:text-white hover:underline focus-visible:text-text">
          <ChevronLeft aria-hidden="true" className="size-5 shrink-0" />
          <Slottable>{children}</Slottable>
        </Slot>
      </IContainer>
    </nav>
  );
}
