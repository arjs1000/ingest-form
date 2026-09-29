import { Slot } from '@radix-ui/react-slot';
import type { ReactElement, ReactNode } from 'react';

export interface ISidebarProps {
  label: string;
  children: ReactNode;
}

/** Admin side navigation. Visible from lg; below that the layout shows an IDropdownMenu instead. */
export function ISidebar({ label, children }: ISidebarProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">{children}</ul>
    </nav>
  );
}

export function ISidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="mt-4 flex flex-col gap-1 first:mt-0">
      <span className="px-3 text-[0.75rem] font-semibold uppercase tracking-wide text-text-secondary">{title}</span>
      <ul className="flex flex-col gap-1">{children}</ul>
    </li>
  );
}

export interface ISidebarItemProps {
  /** A router `Link` with an icon and a label. TanStack sets `data-status="active"` on the current route. */
  children: ReactElement;
}

export function ISidebarItem({ children }: ISidebarItemProps) {
  return (
    <li>
      <Slot className="flex min-h-9 items-center gap-2 rounded-[8px] px-3 text-text no-underline visited:text-text hover:bg-page hover:text-text focus-visible:text-text data-[status=active]:bg-brand-tint data-[status=active]:font-semibold data-[status=active]:text-brand-dark [&_svg]:size-4 [&_svg]:shrink-0">
        {children}
      </Slot>
    </li>
  );
}
