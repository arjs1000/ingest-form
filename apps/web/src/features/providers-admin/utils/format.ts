const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** "27 Sep 2026" in the viewer's time zone. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** "27 Sep 2026, 09:14" in the viewer's time zone. */
export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMAT.format(new Date(iso));
}

/** The curl command a provider runs to send one form with their key. One line, so it pastes into any shell. */
export function curlExample(ingestUrl: string, key: string): string {
  return `curl -X POST ${ingestUrl} -H "Authorization: Bearer ${key}" -H "Content-Type: application/json" -d @form.json`;
}
