---
id: FEAT-003
title: Intake notification emails (Resend)
status: Complete
created: 2026-09-27
completed: 2026-09-29
---

# FEAT-003: Intake notification emails (Resend)

**Status:** Complete
**Priority:** Medium
**Created:** 2026-09-27
**Dependencies:** FEAT-001 (pipeline notify step), FEAT-002 (UI submissions)
**Branch:** (created on approval)

## Problem

When a submission finishes (from a supplier API or the patient UI), nobody is told. Admins have to check the "Ingested forms" tab to find failures. The pipeline's notify step is a stub that always reports `skipped`.

## Solution

Send one email per submission outcome through Resend:
- **Success** (pipeline completed) → the **success address**.
- **Failure** (pipeline ended at a failed step) → the **failure address**.

Both addresses are set on the admin settings page and stored in the database.

Email content is limited to **reference, status, source, failed step and issue codes, plus a link to the submission in the admin panel**. It contains no names, dates of birth, contact details or addresses, so no patient data sits in inboxes.

## Architecture

```
PipelineRunner
  ├─ completed → notify step → EmailSender.send(successTemplate)  → Resend
  └─ failed    → runner onFailure hook → EmailSender.send(failureTemplate) → Resend
```

- **`EmailSender` interface** (`apps/api/src/features/notifications/email-sender.ts`) with two implementations: `ResendEmailSender` (the `resend` SDK, which uses `fetch` and works on Workers) and a fake for tests.
- **Templates** (`notification-templates.ts`): plain text plus minimal HTML. Subject: `[Bookable ingest] Completed GRU-123089-2026` / `[Bookable ingest] Failed at geocode: GRU-123090-2026`.
- **Notify step:**
  - Success: sends the success email and records `success` on the step run, with the Resend message id as output.
  - Resend error: a **warning**, never a failed submission.
  - No settings or no key: `skipped` with `EMAIL_NOT_CONFIGURED` (current behaviour).
- **Failure email:** sent once per failed attempt from a runner hook (the notify step never runs on failure). The attempt number in the step-run record prevents duplicates when re-running.
- **Re-run of a failed submission that then completes:** sends the success email.

## Database Changes

```prisma
/// Single-row settings table (id = "default").
model NotificationSettings {
  id           String   @id @default("default")
  successEmail String?
  failureEmail String?
  updatedAt    DateTime @updatedAt
}
```

## Admin UI

A new "Notifications" section in Admin → General:
- success email and failure email inputs (validated emails), saved to `PUT /api/admin/settings/notifications`;
- a "Send test email" button per address (`POST /api/admin/settings/notifications/test`);
- status text showing whether `RESEND_API_KEY` is configured (without revealing it).

## Environment Variables

```bash
# Email — Resend (optional; emails are skipped without the key)
RESEND_API_KEY=            # secret: wrangler secret put RESEND_API_KEY
RESEND_FROM_EMAIL=         # verified sender, e.g. "Bookable <notifications@yourdomain.com>"
ADMIN_BASE_URL=            # used for links in emails, e.g. http://localhost:8301 or the deployed admin origin
```

- `RESEND_API_KEY` is not the only variable needed. Resend also needs a **from address on a domain verified in Resend**; its shared `onboarding@resend.dev` sender only delivers to the email address of the Resend account itself, which is fine for local testing.
- `ADMIN_BASE_URL` is needed for the admin link in each email.
- The recipient addresses are **not** env vars: they live in the database so admins can change them.

## Phases

| Phase | Scope |
|-------|-------|
| 1 | `NotificationSettings` model + migration, admin API (get/put/test), `EmailSender` + fake |
| 2 | Notify step sends success; runner failure hook; idempotency per attempt; 2 tests (success email sent once, failure email sent once per attempt) |
| 3 | Admin "Notifications" section, e2e with a real Resend key against the account's own address, docs |

## Decisions (answers to the open questions)

1. Resend account and domain: the deployer sets `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (a verified domain). Local testing can use `onboarding@resend.dev`, which only delivers to the Resend account's own address.
2. One address each for success and failure.
3. The same addresses for supplier (API) and patient (UI) submissions.
4. One email per outcome, no digest. Resend's free-tier limits are unverified; revisit if volume grows.

## As built

Differences from the design above:

- **No "Send test email" button** or `/test` endpoint (out of scope). Test by submitting a form.
- **Plain `fetch`** to `POST https://api.resend.com/emails` instead of the `resend` SDK: no new dependency, same code on Node and Workers. `email-sender.ts`.
- **Failure email** comes from the runner (`notifyFailure` in `run-pipeline.ts`, right after the failed update), not a separate hook dependency. The notifier lives in `StepDeps` as `notifier: SubmissionNotifier`, an interface owned by the pipeline (`step.types.ts`) and implemented in `features/notifications/submission-notifier.ts`.
- **Once per attempt** is enforced by the flow (one `execute` per attempt) and by Resend's `Idempotency-Key` (`<completed|failed>-<submissionId>-<attempt>`), not by a step-run record.
- **Issue codes on the notify step:** `EMAIL_NOT_CONFIGURED` (no key or sender, skipped), `EMAIL_NO_RECIPIENT` (no address saved, skipped), `EMAIL_SEND_FAILED` (Resend refused or timed out, warning). Output on success: `{ applicationId, emailId }`.
- **Admin UI:** "Notifications" section under the upload settings in Admin → General, with an "Email on / Email off" badge from `emailConfigured`.
- **Tests:** two existing pipeline tests extended (success email; failure then success email across a re-run), plus one API route test and one form test.

## Verification

1. A completed submission sends one success email to the configured address, with the reference and admin link and no patient data.
2. A failed submission sends one failure email per attempt, including the failed step and issue codes.
3. A Resend error leaves the submission completed, with a warning on the notify step.
4. With no key or no addresses, the notify step is `skipped` and nothing else changes.

## Changelog

| Date | Change |
|------|--------|
| 2026-09-27 | Draft spec written for user review (scoped out of FEAT-002) |
| 2026-09-29 | Built. Decisions and deviations recorded under "Decisions" and "As built" |
