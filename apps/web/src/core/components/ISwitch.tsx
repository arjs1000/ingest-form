import * as Switch from '@radix-ui/react-switch';

import { cn } from '@/core/lib/cn';

export interface ISwitchProps {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * On/off setting that applies immediately (admin surface). For patient answers use IRadios
 * or ICheckbox instead. With react-hook-form, bind it through `Controller`.
 */
export function ISwitch({ id, label, hint, checked, onCheckedChange, disabled }: ISwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer font-semibold">
          {label}
        </label>
        {hint ? (
          <span id={`${id}-hint`} className="text-text-secondary">
            {hint}
          </span>
        ) : null}
      </div>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'bg-border-strong data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <Switch.Thumb className="block size-5 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-5" />
      </Switch.Root>
    </div>
  );
}
