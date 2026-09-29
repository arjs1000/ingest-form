import 'react-phone-number-input/style.css';

import { ChevronDown, Globe } from 'lucide-react';
import { lazy, Suspense, type ChangeEvent, type FocusEvent, type Ref } from 'react';
import PhoneInput, {
  getCountryCallingCode,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  type Country,
  type Value,
} from 'react-phone-number-input';

import { cn } from '@/core/lib/cn';

import type { IFormFieldControlProps } from './IFormField';
import { IInput } from './IInput';

// Validity helpers for form schemas, so features never import the phone library directly.
export { isPossiblePhoneNumber, isValidPhoneNumber };

export interface IPhoneInputProps extends Partial<IFormFieldControlProps> {
  /** E.164, e.g. "+447123456789", or '' when empty. */
  value: string | undefined;
  /** Receives E.164, or '' when the field is cleared. */
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  name?: string;
  /** "tel" by default; "tel-national" etc. also work. */
  autoComplete?: string;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
  className?: string;
}

/**
 * Every country's flag as an inline SVG, bundled with the library (no third-party requests).
 * All of them are ~58KB gzipped, so they load in their own chunk after the field renders.
 */
const LazyFlag = lazy(async () => {
  const { default: flags } = await import('react-phone-number-input/flags');
  function Flag({ country }: { country: Country }) {
    const Svg = flags[country];
    // The wrapper is aria-hidden: the select's option text already names the country.
    return Svg ? <Svg title="" /> : null;
  }
  return { default: Flag };
});

function CountryFlag({ country }: { country: Country | undefined }) {
  if (!country) return <Globe aria-hidden="true" className="size-5 text-text-secondary" />;
  return (
    <span aria-hidden="true" className="block h-4 w-6 shrink-0 overflow-hidden rounded-[2px] bg-page [&>svg]:block [&>svg]:size-full">
      <Suspense fallback={null}>
        <LazyFlag country={country} />
      </Suspense>
    </span>
  );
}

interface CountryOption {
  value?: Country;
  label: string;
  divider?: boolean;
}

/** The props react-phone-number-input passes to `countrySelectComponent`. */
interface CountrySelectProps {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  name?: string;
  'aria-label'?: string;
  onFocus?: (event: FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Native <select>, made transparent and laid over a face that shows the flag and dial code.
 * Phones open their own picker; options read "United Kingdom +44".
 */
function CountrySelect({ value, onChange, options, disabled, readOnly, ...props }: CountrySelectProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-(--control-h) shrink-0 items-center gap-2 rounded-(--control-radius) border-(length:--control-border-w) border-text-secondary bg-surface pl-3 pr-2',
        'text-(length:--control-text) text-text has-[select:focus-visible]:focus-ring',
        disabled && 'border-border-strong bg-page text-text-secondary [&>span]:opacity-50',
      )}
    >
      <CountryFlag country={value} />
      <span aria-hidden="true" className="tabular-nums">
        {value ? `+${getCountryCallingCode(value)}` : '+'}
      </span>
      <ChevronDown aria-hidden="true" className="size-5" />
      <select
        {...props}
        value={value ?? ''}
        disabled={disabled || readOnly}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange((event.target.value || undefined) as Country | undefined)}
        className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0 text-base disabled:cursor-not-allowed"
      >
        {options.map((option) =>
          option.divider ? (
            <option key="|" value="|" disabled>
              ──────────
            </option>
          ) : (
            <option key={option.value ?? 'ZZ'} value={option.value ?? ''}>
              {option.value ? `${option.label} +${getCountryCallingCode(option.value)}` : option.label}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

/**
 * Phone number with a country select (react-phone-number-input). GB by default, so UK numbers
 * are typed as dialled ("07123 456789") and stored as E.164 ("+447123456789"). The country
 * select is a native <select> (named "Phone number country") showing the flag and dial code.
 */
export function IPhoneInput({ value, onChange, className, autoComplete = 'tel', ref, ...props }: IPhoneInputProps) {
  return (
    <PhoneInput
      {...props}
      // Typed as a class component, but the library forwards the ref to the number input.
      ref={ref as never}
      className={cn('IPhoneInput', className)}
      defaultCountry="GB"
      value={(value || undefined) as Value | undefined}
      onChange={(next) => onChange(next ?? '')}
      autoComplete={autoComplete}
      inputMode="tel"
      inputComponent={IInput}
      countrySelectComponent={CountrySelect}
      addInternationalOption={false}
      countryOptionsOrder={['GB', '|', '...']}
    />
  );
}
