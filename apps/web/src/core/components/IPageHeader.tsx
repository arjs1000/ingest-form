import type { ReactNode } from 'react';

import { IHeading } from './IHeading';
import { IText } from './IText';

export interface IPageHeaderProps {
  title: string;
  description?: string;
  /** Above the title, e.g. an IBreadcrumb or IStepProgress. */
  eyebrow?: ReactNode;
  /** Right-aligned on md+, below the description on mobile. */
  actions?: ReactNode;
}

/** The h1 block at the top of a page. One per page. */
export function IPageHeader({ title, description, eyebrow, actions }: IPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <IHeading level={1}>{title}</IHeading>
          {description ? (
            <IText as="p" tone="secondary">
              {description}
            </IText>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
