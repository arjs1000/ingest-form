import { useEffect, useState } from 'react';

import { IText } from '@/core/components/IText';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

const TOKENS = [
  'brand',
  'brand-dark',
  'brand-bar',
  'brand-tint',
  'action',
  'action-hover',
  'action-edge',
  'action-tint',
  'text',
  'text-secondary',
  'border',
  'border-strong',
  'page',
  'surface',
  'error',
  'error-tint',
  'warning',
  'warning-tint',
  'focus',
  'status-ok',
] as const;

/** Reads the live token values from styles.css, so the page can never show stale hex values. */
function useTokenValues(): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setValues(Object.fromEntries(TOKENS.map((token) => [token, styles.getPropertyValue(`--color-${token}`).trim()])));
  }, []);
  return values;
}

export function ColoursSection() {
  const values = useTokenValues();
  return (
    <ShowcaseSection id="colours" title="Colours" description="Tokens from styles.css @theme. Use the utilities (bg-brand), never hex values.">
      <ShowcaseItem name="Tokens" usage="bg-<token>, text-<token>, border-<token>" wide>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TOKENS.map((token) => (
            <li key={token} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-10 shrink-0 rounded-[8px] border border-border"
                style={{ backgroundColor: `var(--color-${token})` }}
              />
              <span className="flex min-w-0 flex-col">
                <IText size="sm" weight="semibold" truncate>
                  {token}
                </IText>
                <IText size="sm" tone="secondary" className="font-mono">
                  {values[token] ?? ''}
                </IText>
              </span>
            </li>
          ))}
        </ul>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
