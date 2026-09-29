// Flow: a patient uploads a form to /api/v1/intake/extract (within the admin's upload settings) to
// pre-fill their details, then submits them to /api/v1/intake, which stores them as a UI submission
// and runs the ingest pipeline.
import { readFileSync } from 'node:fs';

import { APPLICATION_REFERENCE_PATTERN } from '@ingest-form/shared';
import { describe, expect, it } from 'vitest';

import { createIngestTestApp, type IngestTestApp } from '../../ingest-api/test/ingest-test-app';
import type { OcrClient } from '../extraction/paddle-ocr.client';

function postExtract(testApp: IngestTestApp, file: File, documentType: string): Promise<Response> {
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  return Promise.resolve(testApp.app.request('/api/v1/intake/extract', { method: 'POST', body: form }));
}

/** The synthetic GMS1 (fake details typed as annotations) and what a person would read from it. */
const SYNTHETIC_GMS1_FIELDS = {
  name: 'Alex Example',
  gender: 'male',
  date_of_birth: '1990-07-04',
  phone_number: '+447700900123',
  address: { address_line_1: '1 Example Street, Flat 2', address_line_2: 'Westminster', postcode: 'SW1A 1AA' },
};

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
}

/** Stands in for the PaddleOCR sidecar: returns the words it produced for the synthetic scan. */
const recordedOcr: OcrClient = {
  name: 'paddleocr',
  readWords: async () => JSON.parse(new TextDecoder().decode(fixture('gms1-synthetic-scan.ocr-words.json'))),
};

describe('POST /api/v1/intake/extract', () => {
  it('reads the details typed onto a PDF from the PDF itself, without OCR', async () => {
    const testApp = createIngestTestApp();
    const pdf = new File([fixture('gms1-synthetic-annotated.pdf')], 'form.pdf', { type: 'application/pdf' });

    const res = await postExtract(testApp, pdf, 'gms1');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: { documentType: 'gms1', extractor: 'pdf-native', fields: SYNTHETIC_GMS1_FIELDS },
    });
  });

  it('sends a photo to the OCR sidecar and maps its words with the blank form template', async () => {
    const testApp = createIngestTestApp({ ocr: recordedOcr });
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])], 'photo.png', { type: 'image/png' });

    const res = await postExtract(testApp, png, 'gms1');

    expect(res.status).toBe(200);
    // Address line 1 is left out: in this fixture the typed address covers the printed "Home
    // address" label, so the template removes its first words as printed text.
    const { address_line_1: _covered, ...address } = SYNTHETIC_GMS1_FIELDS.address;
    expect(await res.json()).toMatchObject({
      data: { extractor: 'paddleocr', fields: { ...SYNTHETIC_GMS1_FIELDS, address } },
    });
  });

  it('returns 415 for a file that is not a PDF, JPG or PNG even when it claims to be a PDF', async () => {
    const testApp = createIngestTestApp();
    const fake = new File(['not really a pdf'], 'form.pdf', { type: 'application/pdf' });

    const res = await postExtract(testApp, fake, 'gms1');

    expect(res.status).toBe(415);
    expect(await res.json()).toMatchObject({ error: { code: 'UNSUPPORTED_MEDIA_TYPE' } });
  });
});

describe('upload settings from Admin → General', () => {
  it('are saved, served to the patient flow, and enforced by extract: 413 over the limit, 415 for a photo when photos are off', async () => {
    const testApp = createIngestTestApp();
    const saved = await testApp.app.request('/api/admin/settings/intake', {
      method: 'PUT',
      body: JSON.stringify({ acceptPhotos: false, maxFileSizeMb: 5 }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(saved.status).toBe(200);

    const served = await testApp.app.request('/api/v1/intake/settings');
    expect(await served.json()).toEqual({ data: { acceptPhotos: false, maxFileSizeMb: 5 } });

    const sixMbPdf = new File([new Uint8Array(6 * 1024 * 1024).fill(0x25)], 'big.pdf', { type: 'application/pdf' });
    const tooBig = await postExtract(testApp, sixMbPdf, 'gms1');
    expect(tooBig.status).toBe(413);
    expect(await tooBig.json()).toMatchObject({ error: { message: 'The file must be 5MB or smaller' } });

    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])], 'photo.png', { type: 'image/png' });
    const photo = await postExtract(testApp, png, 'gms1');
    expect(photo.status).toBe(415);
    expect(await photo.json()).toMatchObject({ error: { message: 'Upload a PDF' } });
  });
});

describe('POST /api/v1/intake', () => {
  it('generates a UIF reference when missing, stores the body as a UI submission and returns 202', async () => {
    const testApp = createIngestTestApp();
    const body = JSON.stringify({ name: 'Sam Example', application_reference: '' });

    const res = await testApp.app.request('/api/v1/intake', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status).toBe(202);
    const { data } = (await res.json()) as { data: { submissionId: string; status: string; applicationReference: string } };
    expect(data.status).toBe('completed');
    expect(data.applicationReference).toMatch(/^UIF-\d{6}-2026$/);
    expect(data.applicationReference).toMatch(APPLICATION_REFERENCE_PATTERN);
    const stored = await testApp.submissions.findById(data.submissionId);
    expect(stored?.source).toBe('ui');
    expect(JSON.parse(stored?.rawBody ?? '{}')).toMatchObject({ application_reference: data.applicationReference });
  });
});
