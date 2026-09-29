import {
  apiSuccessSchema,
  bulkRerunResultDtoSchema,
  duplicateGroupDtoSchema,
  ingestResultDtoSchema,
  submissionDetailDtoSchema,
  submissionListDtoSchema,
  type BulkRerunResultDto,
  type DuplicateGroupDto,
  type IngestResultDto,
  type StepName,
  type SubmissionDetailDto,
  type SubmissionListDto,
} from '@ingest-form/shared';
import { z } from 'zod';

import { apiGet, apiPost } from '@/core/lib/api-client';

import { SUBMISSIONS_PAGE_SIZE } from '../constants';
import type { SubmissionFilters } from '../types';

const BASE = '/api/admin/submissions';

const submissionListEnvelope = apiSuccessSchema(submissionListDtoSchema);
const submissionDetailEnvelope = apiSuccessSchema(submissionDetailDtoSchema);
const duplicatesEnvelope = apiSuccessSchema(z.array(duplicateGroupDtoSchema));
const ingestResultEnvelope = apiSuccessSchema(ingestResultDtoSchema);
const bulkRerunEnvelope = apiSuccessSchema(bulkRerunResultDtoSchema);

export function submissionListSearch(filters: SubmissionFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.source) params.set('source', filters.source);
  if (filters.failedStep) params.set('failedStep', filters.failedStep);
  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(SUBMISSIONS_PAGE_SIZE));
  return params.toString();
}

export async function fetchSubmissions(filters: SubmissionFilters): Promise<SubmissionListDto> {
  return (await apiGet(`${BASE}?${submissionListSearch(filters)}`, submissionListEnvelope)).data;
}

export async function fetchSubmission(id: string): Promise<SubmissionDetailDto> {
  return (await apiGet(`${BASE}/${encodeURIComponent(id)}`, submissionDetailEnvelope)).data;
}

export async function fetchDuplicateGroups(): Promise<DuplicateGroupDto[]> {
  return (await apiGet(`${BASE}/duplicates`, duplicatesEnvelope)).data;
}

export interface RerunSubmissionVariables {
  id: string;
  fromStep?: StepName;
}

export async function rerunSubmission({ id, fromStep }: RerunSubmissionVariables): Promise<IngestResultDto> {
  const body = fromStep ? { fromStep } : {};
  return (await apiPost(`${BASE}/${encodeURIComponent(id)}/rerun`, body, ingestResultEnvelope)).data;
}

export async function rerunFailedAtStep(step: StepName): Promise<BulkRerunResultDto> {
  return (await apiPost(`${BASE}/rerun-failed`, { step }, bulkRerunEnvelope)).data;
}
