import type { ReactNode } from 'react';

export interface ITopBarProps {
  brand: ReactNode;
  /** Left of the actions, e.g. the mobile navigation menu. */
  children?: ReactNode;
  actions?: ReactNode;
}

/** Admin header: compact white bar, brand left, actions right. Patient pages use IHeader instead. */
export function ITopBar({ brand, children, actions }: ITopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-14 w-full max-w-admin flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:px-6">
        <div className="flex min-w-0 items-center gap-2">{brand}</div>
        <div className="flex flex-1 items-center">{children}</div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
