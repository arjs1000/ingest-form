import type {
  BulkRerunResultDto,
  DuplicateGroupDto,
  IngestResultDto,
  StepName,
  SubmissionDetailDto,
  SubmissionListDto,
  SubmissionListQuery,
} from '@ingest-form/shared';

import { NotFoundError } from '../../core/errors/app-error';
import { groupDuplicates } from '../ingest/duplicates/duplicate-rules';
import type { PipelineRunner } from '../ingest/pipeline/pipeline.types';
import type { ApplicationRepository, SubmissionRepository } from '../ingest/repositories/ingest.repositories';
import { toApplicationDto, toStepRunDto, toSubmissionSummaryDto } from './admin-ingest.mappers';

export interface SubmissionsService {
  list(query: SubmissionListQuery): Promise<SubmissionListDto>;
  get(id: string): Promise<SubmissionDetailDto>;
  listDuplicates(): Promise<DuplicateGroupDto[]>;
  rerun(id: string, fromStep?: StepName): Promise<IngestResultDto>;
  rerunFailedAt(step: StepName): Promise<BulkRerunResultDto>;
}

export interface SubmissionsServiceDeps {
  submissions: Pick<SubmissionRepository, 'list' | 'findById' | 'listStepRuns' | 'listDuplicateCandidates'>;
  applications: Pick<ApplicationRepository, 'findBySubmissionId'>;
  pipeline: PipelineRunner;
}

export function createSubmissionsService(deps: SubmissionsServiceDeps): SubmissionsService {
  const { submissions, applications, pipeline } = deps;

  return {
    async list(query) {
      const result = await submissions.list(query);
      return {
        items: result.items.map(toSubmissionSummaryDto),
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      };
    },

    async get(id) {
      const submission = await submissions.findById(id);
      if (!submission) throw new NotFoundError(`Submission ${id} not found`);
      const [steps, application] = await Promise.all([
        submissions.listStepRuns(id),
        applications.findBySubmissionId(id),
      ]);
      return {
        ...toSubmissionSummaryDto(submission),
        rawBody: submission.rawBody,
        steps: steps.map(toStepRunDto),
        application: application ? toApplicationDto(application) : null,
      };
    },

    async listDuplicates() {
      const candidates = await submissions.listDuplicateCandidates();
      // Grouped from current data on every request, so a manual DELETE is reflected immediately.
      const groups = groupDuplicates(
        candidates.map(({ submission, person }) => ({
          id: submission.id,
          receivedAt: submission.receivedAt,
          applicationReference: submission.applicationReference,
          person,
          submission,
        })),
      );
      return groups.map((group) => ({
        key: group.members[0]?.id ?? '',
        matchedOn: group.matchedOn,
        submissions: group.members.map((member) => ({
          ...toSubmissionSummaryDto(member.submission),
          person: member.person,
          matchReason: group.reasons.get(member.id) ?? null,
        })),
      }));
    },

    rerun: (id, fromStep) => pipeline.rerun(id, fromStep),

    rerunFailedAt: (step) => pipeline.rerunFailedAt(step),
  };
}
