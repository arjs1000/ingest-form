// FEAT-001 end-to-end check against a running API. Usage: node e2e-ingest.mjs http://localhost:8305
import { readFile } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://localhost:8305';
const PROVIDER_NAME = `E2E ${Date.now()}`;

const EX1 = {"session_id":"c8267b77-d796-451e-9948-e82f56412b56","application_reference":"GRU-123089-2026","name":"John Doe","email":"john.doe@example.com","gender":"male","date_of_birth":"1990-01-01","phone_number":"07123456789","mobile_number":"07123456789","address":{"address_line_1":"Stratford Village Surgery","address_line_2":"50C Romford Road","address_line_3":"London","postcode":"E15 4BZ","country":"United Kingdom"}};
const EX2 = {"session_id":"c77fb77f-5a95-4935-9d5a-12953f29da89","application_reference":"GRU-123090-2026","name":"Andy James Smith-Jones","email":"andy.smith.jones@example.com","gender":"other","date_of_birth":"1985-06-20","phone_number":"0001","mobile_number":"07777777777","address":{"address_line_1":"1 The Avenue","address_line_2":"Bristol","postcode":"BS1 1AA","country":"United Kingdom"}};
const EX3 = {"session_id":"881fa3b2-84cd-4517-b909-84a073ca0110","application_reference":"GRU-123092-2026","name":"Jane Doe","email":"jane.doe@example.com","gender":"female","date_of_birth":"1921-03-14","mobile_number":"07123456789","address":{"address_line_1":"123 Main St","address_line_2":"Apt 1","postcode":"SW1A 1AA","country":"United Kingdom"}};

let failures = 0;
function check(label, condition, detail = '') {
  if (!condition) failures += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
}

async function call(method, path, { body, key, raw } = {}) {
  const headers = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, headers: res.headers };
}

const provider = await call('POST', '/api/admin/providers', { body: { name: PROVIDER_NAME } });
check('create provider 201', provider.status === 201);
const providerId = provider.json.data.id;
const created = await call('POST', `/api/admin/providers/${providerId}/keys`, { body: { label: 'e2e' } });
check('create key 201 + active', created.status === 201 && created.json.data.apiKey.status === 'active');
const key = created.json.data.key;
check('key format ifk_ + 32', /^ifk_[A-Za-z0-9]{32}$/.test(key));

const noKey = await call('POST', '/api/v1/ingest', { body: EX1 });
check('no key -> 401 UNAUTHENTICATED', noKey.status === 401 && noKey.json.error.code === 'UNAUTHENTICATED');

const results = {};
for (const [name, payload] of [['ex1', EX1], ['ex3', EX3]]) {
  const res = await call('POST', '/api/v1/ingest', { body: payload, key });
  results[name] = res.json?.data;
  check(`${name} -> 202 completed`, res.status === 202 && res.json.data.status === 'completed', JSON.stringify(res.json?.data?.issues ?? res.json));
}
// BS1 1AA was terminated in Dec 1998 (postcodes.io), so Example 2 as given must fail at geocode.
const ex2Raw = await call('POST', '/api/v1/ingest', { body: EX2, key });
check('ex2 as given fails at geocode: POSTCODE_TERMINATED', ex2Raw.json.data.failedStep === 'geocode' && ex2Raw.json.data.issues.some((i) => i.code === 'POSTCODE_TERMINATED'));
// Same record with a live Bristol postcode, to check the transform rules.
const ex2Live = await call('POST', '/api/v1/ingest', { body: { ...EX2, application_reference: 'GRU-123091-2026', address: { ...EX2.address, postcode: 'BS1 4DJ' } }, key });
results.ex2 = ex2Live.json.data;
check('ex2 (live postcode) -> completed', results.ex2.status === 'completed', JSON.stringify(results.ex2.issues));
const ex2Codes = results.ex2.issues.map((i) => i.code);
check('ex2 warns INVALID_PHONE_DROPPED + GENDER_MAPPED', ex2Codes.includes('INVALID_PHONE_DROPPED') && ex2Codes.includes('GENDER_MAPPED'), ex2Codes.join(','));

const detail1 = (await call('GET', `/api/admin/submissions/${results.ex1.submissionId}`)).json.data;
const app1 = detail1.application;
check('ex1 application E.164 mobile', app1?.mobileNumber === '+447123456789', app1?.mobileNumber);
check('ex1 lat/lng from postcodes.io', Math.abs(app1?.latitude - 51.542097) < 0.001 && Math.abs(app1?.longitude - 0.006388) < 0.001, `${app1?.latitude},${app1?.longitude}`);
check('ex1 six step runs recorded', detail1.steps.length === 6, detail1.steps.map((s) => `${s.step}:${s.status}`).join(' '));
const app2 = (await call('GET', `/api/admin/submissions/${results.ex2.submissionId}`)).json.data.application;
check('ex2 name split Andy James / Smith-Jones', app2?.firstName === 'Andy James' && app2?.lastName === 'Smith-Jones');
check('ex2 gender prefer-not-to-say, phone dropped', app2?.gender === 'prefer-not-to-say' && app2?.phoneNumber === null);
const app3 = (await call('GET', `/api/admin/submissions/${results.ex3.submissionId}`)).json.data.application;
check('ex3 no phone, no line 3, DOB 1921', app3?.phoneNumber === null && app3?.addressLine3 === null && app3?.dateOfBirth === '1921-03-14');

const invalid = await call('POST', '/api/v1/ingest', { raw: '{"name": "broken', key });
check('invalid JSON stored, fails at validate', invalid.status === 202 && invalid.json.data.failedStep === 'validate' && invalid.json.data.issues[0].code === 'INVALID_JSON');

const badPostcode = await call('POST', '/api/v1/ingest', { body: { ...EX1, application_reference: 'GRU-999999-2026', address: { ...EX1.address, postcode: 'ZZ9 9ZZ' } }, key });
check('unknown postcode fails at geocode', badPostcode.json.data.failedStep === 'geocode', JSON.stringify(badPostcode.json.data.issues));
const rerunGeo = await call('POST', `/api/admin/submissions/${badPostcode.json.data.submissionId}/rerun`, { body: {} });
check('rerun still fails at geocode (data not fixed)', rerunGeo.status === 200 && rerunGeo.json.data.failedStep === 'geocode');
const afterRerun = (await call('GET', `/api/admin/submissions/${badPostcode.json.data.submissionId}`)).json.data;
check('rerun increments attempts, keeps attempt history', afterRerun.attempts === 2 && afterRerun.steps.some((s) => s.attempt === 2), `attempts=${afterRerun.attempts}`);

const rerunDone = await call('POST', `/api/admin/submissions/${results.ex1.submissionId}/rerun`, { body: {} });
check('rerun completed submission -> 409', rerunDone.status === 409);

const dup = await call('POST', '/api/v1/ingest', { body: EX1, key });
const dupDetail = (await call('GET', `/api/admin/submissions/${dup.json.data.submissionId}`)).json.data;
check('duplicate linked via duplicateOfId', dupDetail.duplicateOfId !== null);
const groups = (await call('GET', '/api/admin/submissions/duplicates')).json.data;
check('duplicates tab lists GRU-123089-2026 (same reference)', groups.some((g) => g.matchedOn.includes('same_reference') && g.submissions.filter((s) => s.applicationReference === 'GRU-123089-2026').length >= 2));

const list = (await call('GET', '/api/admin/submissions?status=failed&pageSize=5')).json.data;
check('list filter status=failed', list.items.every((s) => s.status === 'failed') && list.total >= 2, `total=${list.total}`);

// Same person across channels: supplier API first, then the patient UI with a different (generated) reference.
// Mobiles are unique per run: a fixed number would match the previous run's Casey by the same-person rule.
const runDigits = String(Date.now()).slice(-8);
const casey = { ...EX3, name: 'Casey Duplicate', email: `casey.${Date.now()}@example.com`, mobile_number: `077${runDigits}` };
const caseyApi = await call('POST', '/api/v1/ingest', { body: { ...casey, session_id: crypto.randomUUID(), application_reference: `GRU-${String(Date.now()).slice(-6)}-2026` }, key });
const caseyUi = await call('POST', '/api/v1/intake', { body: { ...casey, session_id: crypto.randomUUID(), application_reference: undefined, mobile_number: `078${runDigits}` } });
const caseyUiDetail = (await call('GET', `/api/admin/submissions/${caseyUi.json.data.submissionId}`)).json.data;
check('same name + email via UI -> duplicate of the API submission', caseyUiDetail.duplicateOfId === caseyApi.json.data.submissionId && caseyUiDetail.duplicateReason === 'same_person_email', `${caseyUiDetail.duplicateReason}`);
const namesake = await call('POST', '/api/v1/intake', { body: { ...casey, session_id: crypto.randomUUID(), application_reference: undefined, email: `other.casey.${Date.now()}@example.net`, mobile_number: `079${runDigits}` } });
const namesakeDetail = (await call('GET', `/api/admin/submissions/${namesake.json.data.submissionId}`)).json.data;
check('same name, different email and mobile -> not a duplicate', namesakeDetail.duplicateOfId === null && namesakeDetail.duplicateReason === null);
const personGroups = (await call('GET', '/api/admin/submissions/duplicates')).json.data;
const caseyGroup = personGroups.find((g) => g.key === caseyApi.json.data.submissionId);
check('duplicates tab groups Casey (2 members, same email)', caseyGroup?.submissions.length === 2 && caseyGroup.matchedOn.includes('same_person_email'), JSON.stringify(caseyGroup?.matchedOn));
console.log(`INFO  casey first-received id: ${caseyApi.json.data.submissionId}  duplicate id: ${caseyUi.json.data.submissionId}`);

const big = await call('POST', '/api/v1/ingest', { raw: JSON.stringify({ pad: 'x'.repeat(70 * 1024) }), key });
check('body over 64KB -> 413', big.status === 413, String(big.status));

await call('POST', `/api/admin/keys/${created.json.data.apiKey.id}/revoke`);
const revoked = await call('POST', '/api/v1/ingest', { body: EX1, key });
check('revoked key -> 401 API_KEY_REVOKED', revoked.status === 401 && revoked.json.error.code === 'API_KEY_REVOKED');

const malformed = await call('POST', '/api/admin/providers', { raw: '{"name": ' });
check('malformed admin JSON -> 400', malformed.status === 400);

// IP limiter: 20/60s before auth. Burst with a bad key until 429.
let limited = null;
for (let i = 0; i < 25 && !limited; i += 1) {
  const res = await call('POST', '/api/v1/ingest', { body: {}, key: 'ifk_nope' });
  if (res.status === 429) limited = res;
}
check('burst -> 429 with Retry-After', limited !== null && Number(limited.headers.get('retry-after')) > 0, limited?.headers.get('retry-after') ?? 'none');

// ── FEAT-002: patient intake (public endpoints, source ui) ─────────────────────
async function extract(bytes, type, documentType) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), 'form.pdf');
  form.append('documentType', documentType);
  const res = await fetch(`${BASE}/api/v1/intake/extract`, { method: 'POST', body: form });
  return { status: res.status, json: await res.json().catch(() => null) };
}
// FEAT-005: the synthetic GMS1 (fake details typed as PDF annotations) is read without OCR.
const syntheticPdf = await readFile(new URL('../apps/api/src/features/intake-api/test/fixtures/gms1-synthetic-annotated.pdf', import.meta.url));
const gms1 = await extract(syntheticPdf, 'application/pdf', 'gms1');
check('extract annotated gms1 -> 200 read by pdf-native', gms1.status === 200 && gms1.json.data.extractor === 'pdf-native' && gms1.json.data.fields.name === 'Alex Example' && gms1.json.data.fields.address?.postcode === 'SW1A 1AA', JSON.stringify(gms1.json?.data ?? gms1.json));
const pdfBytes = new TextEncoder().encode('%PDF-1.7\n% synthetic test document\n');
const other = await extract(pdfBytes, 'application/pdf', 'other');
check('extract unreadable PDF -> no fields', other.status === 200 && Object.keys(other.json.data.fields).length === 0);
const fake = await extract(new TextEncoder().encode('not a pdf at all'), 'application/pdf', 'gms1');
check('extract non-PDF bytes claiming PDF -> 415', fake.status === 415 && fake.json.error.code === 'UNSUPPORTED_MEDIA_TYPE');

const uiPayload = { ...EX1, session_id: crypto.randomUUID(), application_reference: undefined };
const intake = await call('POST', '/api/v1/intake', { body: uiPayload });
const intakeData = intake.json?.data;
check('intake -> 202 completed with generated UIF reference', intake.status === 202 && intakeData.status === 'completed' && /^UIF-\d{6}-\d{4}$/.test(intakeData.applicationReference ?? ''), JSON.stringify(intakeData));
const intakeDetail = (await call('GET', `/api/admin/submissions/${intakeData.submissionId}`)).json.data;
check('intake submission has source ui, no provider', intakeDetail.source === 'ui' && intakeDetail.providerName === null);
const terminated = await call('POST', '/api/v1/intake', { body: { ...EX2, session_id: crypto.randomUUID() } });
check('intake with terminated postcode -> 202 failed at geocode (non-critical)', terminated.status === 202 && terminated.json.data.failedStep === 'geocode');

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
