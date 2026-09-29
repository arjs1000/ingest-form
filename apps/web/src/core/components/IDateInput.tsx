import 'react-day-picker/style.css';

import * as Popover from '@radix-ui/react-popover';
import { CalendarDays } from 'lucide-react';
import { useState, type FocusEvent, type Ref } from 'react';
import { DayPicker } from 'react-day-picker';
import { enGB } from 'react-day-picker/locale';

import { cn } from '@/core/lib/cn';

import type { IFormFieldControlProps } from './IFormField';
import { IInput } from './IInput';

export interface IDateInputProps extends Partial<IFormFieldControlProps> {
  /** ISO date "YYYY-MM-DD", or '' when empty, incomplete or not a real date. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  name?: string;
  /** "bday" by default (date of birth). */
  autoComplete?: string;
  /** Earliest month in the calendar dropdowns. Default January 1900. */
  startMonth?: Date;
  /** Latest month in the calendar. Default: this month. */
  endMonth?: Date;
  /** Grey out days after today (default true: most dates we ask for are in the past). */
  disableFuture?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** Local calendar date → "YYYY-MM-DD" (no time zone shift: DayPicker days are local midnight). */
function toIso(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" → local Date, or undefined. */
function fromIso(iso: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** "YYYY-MM-DD" → "DD/MM/YYYY". */
function isoToDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/**
 * Typed text → ISO, or '' when it is not a complete real date. Accepts "15/03/1984",
 * "15/3/1984", "15-03-1984", "15 03 1984" and "15031984".
 */
export function parseDisplayDate(text: string): string {
  const trimmed = text.trim();
  const parts = /^\d{8}$/.test(trimmed)
    ? [trimmed.slice(0, 2), trimmed.slice(2, 4), trimmed.slice(4)]
    : trimmed.split(/[^\d]+/).filter(Boolean);
  if (parts.length !== 3) return '';
  const [day, month, year] = parts.map(Number) as [number, number, number];
  if (String(parts[2]).length !== 4) return '';
  const date = new Date(year, month - 1, day);
  // Round-trip check rejects 31/02 and month 13.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
  return toIso(date);
}

/**
 * Date typed as DD/MM/YYYY, plus a calendar button that opens react-day-picker in a Radix
 * popover (month and year dropdowns, keyboard navigable). Typing is always enough on its own;
 * the calendar is a shortcut. The value is ISO so forms and APIs never see the display format.
 */
export function IDateInput({
  value,
  onChange,
  onBlur,
  autoComplete = 'bday',
  startMonth = new Date(1900, 0),
  endMonth = new Date(),
  disableFuture = true,
  disabled,
  ...props
}: IDateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [lastValue, setLastValue] = useState(value);
  const [open, setOpen] = useState(false);

  // Adjust state while rendering when the value changes from outside (calendar pick, form reset),
  // but keep what the person is typing when it already means the same date.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseDisplayDate(text) !== value) setText(isoToDisplay(value));
  }

  const selected = fromIso(value);

  return (
    <div className="flex items-stretch gap-2">
      <IInput
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder="DD/MM/YYYY"
        className="max-w-48"
        disabled={disabled}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const iso = parseDisplayDate(event.target.value);
          setLastValue(iso);
          onChange(iso);
        }}
        onBlur={(event) => {
          const iso = parseDisplayDate(text);
          if (iso) setText(isoToDisplay(iso));
          onBlur?.(event);
        }}
      />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          aria-label="Choose date"
          disabled={disabled}
          className={cn(
            'inline-flex min-h-(--control-h) min-w-(--control-h) shrink-0 items-center justify-center rounded-(--control-radius)',
            'border-(length:--control-border-w) border-text-secondary bg-surface text-brand transition-colors hover:bg-brand-tint',
            'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-page disabled:text-text-secondary',
          )}
        >
          <CalendarDays aria-hidden="true" className="size-6" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            aria-label="Calendar"
            className="IDateInput-calendar z-50 rounded-(--card-radius) border border-border bg-surface p-3 font-sans text-text shadow-overlay"
          >
            <DayPicker
              mode="single"
              locale={enGB}
              captionLayout="dropdown"
              startMonth={startMonth}
              endMonth={endMonth}
              defaultMonth={selected ?? endMonth}
              disabled={disableFuture ? { after: new Date() } : undefined}
              selected={selected}
              onSelect={(date) => {
                if (!date) return;
                const iso = toIso(date);
                setText(isoToDisplay(iso));
                setLastValue(iso);
                onChange(iso);
                setOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
