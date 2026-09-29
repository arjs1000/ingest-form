const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const MS_PER_SECOND = 1000;

/** "27 Sep 2026, 09:14" in the viewer's time zone. */
export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMAT.format(new Date(iso));
}

/** "240 ms" under a second, "1.2 s" above. */
export function formatDuration(ms: number): string {
  return ms < MS_PER_SECOND ? `${ms} ms` : `${(ms / MS_PER_SECOND).toFixed(1)} s`;
}

/** "1 issue", "3 issues". */
export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
