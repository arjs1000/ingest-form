import { queryOptions } from '@tanstack/react-query';

import { fetchUploadSettings } from './intake.api';

/** The admin's upload types and size limit. Refetched on each visit so a change applies to the next upload. */
export const uploadSettingsQueryOptions = queryOptions({
  queryKey: ['intake', 'upload-settings'],
  queryFn: fetchUploadSettings,
  staleTime: 0,
});
