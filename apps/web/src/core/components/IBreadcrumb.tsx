import { Slot } from '@radix-ui/react-slot';
import { ChevronRight } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

export function IBreadcrumb({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[0.875em] text-text-secondary">{children}</ol>
    </nav>
  );
}

export interface IBreadcrumbItemProps {
  /** A link for ancestors, or plain text for the current page. */
  children: ReactElement | string;
  current?: boolean;
}

export function IBreadcrumbItem({ children, current = false }: IBreadcrumbItemProps) {
  return (
    <li className="group flex items-center gap-1">
      <ChevronRight aria-hidden="true" className="size-4 group-first:hidden" />
      {current || typeof children === 'string' ? (
        <span aria-current={current ? 'page' : undefined} className="font-semibold text-text">
          {children}
        </span>
      ) : (
        <Slot className="text-text-secondary visited:text-text-secondary hover:text-text focus-visible:text-text">
          {children}
        </Slot>
      )}
    </li>
  );
}
