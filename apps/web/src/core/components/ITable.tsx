import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export interface ITableProps extends HTMLAttributes<HTMLTableElement> {
  /** Classes for the scrolling wrapper (the bordered card), not the table. */
  wrapperClassName?: string;
}

/**
 * Dense data table (admin). The wrapper scrolls horizontally, so a wide table scrolls inside
 * itself and never widens the page. Give it an `ITableCaption` (visible or `sr-only`).
 */
export function ITable({ className, wrapperClassName, ...props }: ITableProps) {
  return (
    <div
      className={cn(
        // `relative` contains absolutely positioned children (e.g. sr-only labels in cells);
        // without it they escape the scroll box and widen the whole page on mobile.
        'relative w-full overflow-x-auto rounded-(--card-radius) border border-border bg-surface shadow-(--card-shadow)',
        wrapperClassName,
      )}
    >
      <table className={cn('w-full border-collapse text-left', className)} {...props} />
    </div>
  );
}

/** Table title for assistive tech. Add `className="sr-only"` when a visible heading already names the table. */
export function ITableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn('border-b border-border px-3 py-2 text-left font-semibold text-text', className)}
      {...props}
    />
  );
}

export function ITableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-page', className)} {...props} />;
}

export function ITableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&>tr:last-child]:border-b-0', className)} {...props} />;
}

export interface ITableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /**
   * Hover tint and pointer cursor for rows with an `onClick`. A row click is a mouse
   * shortcut only: the row must also contain a real link or button for keyboard users.
   */
  clickable?: boolean;
  /** Highlights the row (e.g. the record open in a detail view). */
  selected?: boolean;
}

export function ITableRow({ clickable = false, selected = false, className, ...props }: ITableRowProps) {
  return (
    <tr
      data-selected={selected ? 'true' : undefined}
      className={cn(
        'border-b border-border transition-colors',
        clickable && 'cursor-pointer hover:bg-page',
        selected && 'bg-brand-tint hover:bg-brand-tint',
        className,
      )}
      {...props}
    />
  );
}

export function ITableHeaderCell({ className, scope = 'col', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn(
        'whitespace-nowrap border-b border-border px-3 py-2 align-bottom text-[0.8125em] font-semibold text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}

export function ITableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-2 align-top text-text', className)} {...props} />;
}
