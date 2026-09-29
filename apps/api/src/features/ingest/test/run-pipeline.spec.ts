// Flow: a stored submission runs through validate → normalise → geocode → transform → persist → notify,
// ending as a saved application or as a failed submission an admin can re-run.
import { describe, expect, it } from 'vitest';

import { InMemoryNotificationSettingsRepository } from '../../notifications/notification-settings.repository';
import { createNotificationSettingsService } from '../../notifications/notification-settings.service';
import { createSubmissionNotifier } from '../../notifications/submission-notifier';
import { createPipelineRunner } from '../pipeline/run-pipeline';
import { InMemoryApplicationRepository, InMemorySubmissionRepository } from '../repositories/in-memory.repositories';
import { createFakeEmailSender, createFakePostcodeLookup } from './fixtures/fakes';
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3, FIXED_NOW, INVALID_JSON_BODY } from './fixtures/ingest-payloads';

const SUCCESS_EMAIL = 'success@example.test';
const FAILURE_EMAIL = 'failure@example.test';

/** In-memory repositories, fake postcode lookup and email sender, and a real pipeline runner. */
async function setup() {
  const now = (): Date => FIXED_NOW;
  const submissions = new InMemorySubmissionRepository(now);
  const applications = new InMemoryApplicationRepository(now);
  const postcodeLookup = createFakePostcodeLookup();
  const emails = createFakeEmailSender();
  const settings = createNotificationSettingsService({ repository: new InMemoryNotificationSettingsRepository(), emailConfigured: true });
  await settings.update({ successEmail: SUCCESS_EMAIL, failureEmail: FAILURE_EMAIL });
  const notifier = createSubmissionNotifier({ settings, submissions, sender: emails, adminBaseUrl: 'http://admin.test' });
  const runner = createPipelineRunner({
    submissions,
    stepDeps: { lookupPostcode: postcodeLookup.lookup, applications, now, notifier },
  });

  /** Stores the raw body, the same way POST /api/v1/ingest does before running the pipeline. */
  async function receive(body: string): Promise<string> {
    const submission = await submissions.create({ source: 'api', providerId: null, apiKeyId: null, rawBody: body });
    return submission.id;
  }

  return { submissions, applications, postcodeLookup, emails, runner, receive };
}

describe('ingest pipeline', () => {
  it('completes example 1, saves the application with a formatted mobile, postcode and coordinates, and emails the success address', async () => {
    const { runner, receive, applications, emails } = await setup();
    const id = await receive(JSON.stringify(EXAMPLE_1));

    const result = await runner.run(id);

    expect(result.status).toBe('completed');
    const application = await applications.findBySubmissionId(id);
    expect(application?.mobileNumber).toBe('+447123456789');
    expect(application?.postcode).toBe('E15 4BZ');
    expect(application?.latitude).toBe(51.542097);
    expect(application?.longitude).toBe(0.006388);
    // One success email, with identifiers only: no patient name in it.
    expect(emails.sent).toHaveLength(1);
    expect(emails.sent[0]?.to).toBe(SUCCESS_EMAIL);
    expect(emails.sent[0]?.text).toContain(`/admin/settings?tab=ingested&submission=${id}`);
    expect(emails.sent[0]?.text).not.toContain(application?.lastName);
  });

  it('completes example 2 with warnings: bad phone dropped, name split and gender mapped', async () => {
    const { runner, receive, applications } = await setup();
    const id = await receive(JSON.stringify(EXAMPLE_2));

    const result = await runner.run(id);

    expect(result.status).toBe('completed');
    const warnings = result.issues.map((issue) => issue.code);
    expect(warnings).toContain('INVALID_PHONE_DROPPED');
    expect(warnings).toContain('GENDER_MAPPED');
    const application = await applications.findBySubmissionId(id);
    expect(application?.phoneNumber).toBeUndefined();
    expect(application?.firstName).toBe('Andy James');
    expect(application?.lastName).toBe('Smith-Jones');
    expect(application?.gender).toBe('prefer-not-to-say');
  });

  it('completes example 3, which has no phone number and no address line 3', async () => {
    const { runner, receive, applications } = await setup();
    const id = await receive(JSON.stringify(EXAMPLE_3));

    const result = await runner.run(id);

    expect(result.status).toBe('completed');
    expect(await applications.findBySubmissionId(id)).toBeDefined();
  });

  it('keeps an invalid JSON body and fails it at validate with INVALID_JSON', async () => {
    const { runner, receive, submissions } = await setup();
    const id = await receive(INVALID_JSON_BODY);

    const result = await runner.run(id);

    expect(result.status).toBe('failed');
    expect(result.failedStep).toBe('validate');
    expect(result.issues[0]?.code).toBe('INVALID_JSON');
    expect((await submissions.findById(id))?.rawBody).toBe(INVALID_JSON_BODY);
  });

  it('re-runs a submission that failed at geocode once the postcode lookup is back, emailing the failure then the success', async () => {
    const { runner, receive, submissions, postcodeLookup, emails } = await setup();
    const id = await receive(JSON.stringify(EXAMPLE_1));
    postcodeLookup.down = true;
    const firstRun = await runner.run(id);
    expect(firstRun.failedStep).toBe('geocode');

    postcodeLookup.down = false;
    const secondRun = await runner.rerun(id);

    expect(secondRun.status).toBe('completed');
    expect((await submissions.findById(id))?.attempts).toBe(2);
    // The re-run starts at geocode: validate and normalise ran only once, in attempt 1.
    const attempt2Steps = (await submissions.listStepRuns(id))
      .filter((stepRun) => stepRun.attempt === 2)
      .map((stepRun) => stepRun.step);
    expect(attempt2Steps).toEqual(['geocode', 'transform', 'persist', 'notify']);
    // One email per attempt: the failure (with the step and code) for attempt 1, the success for attempt 2.
    expect(emails.sent.map((email) => email.to)).toEqual([FAILURE_EMAIL, SUCCESS_EMAIL]);
    expect(emails.sent[0]?.subject).toContain('Failed at geocode');
    expect(emails.sent[0]?.text).toContain('GEOCODER_UNAVAILABLE');
  });

  it('links a second submission with the same application reference to the first', async () => {
    const { runner, receive, submissions } = await setup();
    const first = await receive(JSON.stringify(EXAMPLE_1));
    const second = await receive(JSON.stringify(EXAMPLE_1));

    await runner.run(first);
    await runner.run(second);

    expect((await submissions.findById(first))?.duplicateOfId).toBeNull();
    expect((await submissions.findById(second))?.duplicateOfId).toBe(first);
  });

  it('flags the same person by email or by mobile, but not a namesake with a different email and mobile', async () => {
    const { runner, receive, submissions } = await setup();
    // John Doe, john.doe@example.com, 07123456789 — each later submission has its own reference.
    const original = await receive(JSON.stringify(EXAMPLE_1));
    const sameEmail = await receive(
      JSON.stringify({ ...EXAMPLE_1, application_reference: 'UIF-000001-2026', mobile_number: '07777777777' }),
    );
    const sameMobile = await receive(
      JSON.stringify({ ...EXAMPLE_1, application_reference: 'UIF-000002-2026', email: 'j.doe@example.org' }),
    );
    const namesake = await receive(
      JSON.stringify({
        ...EXAMPLE_1,
        application_reference: 'UIF-000003-2026',
        email: 'another.john@example.net',
        mobile_number: '07400123456',
      }),
    );

    for (const id of [original, sameEmail, sameMobile, namesake]) await runner.run(id);

    expect(await submissions.findById(sameEmail)).toMatchObject({ duplicateOfId: original, duplicateReason: 'same_person_email' });
    expect(await submissions.findById(sameMobile)).toMatchObject({ duplicateOfId: original, duplicateReason: 'same_person_mobile' });
    // Same name, but an email and a mobile no other John Doe uses: a different person.
    expect(await submissions.findById(namesake)).toMatchObject({ duplicateOfId: null, duplicateReason: null });
  });
});
