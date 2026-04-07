import type { AggregatorEditorialStatus, AggregatorPublishMode } from '../../db/types';

export const publishService = {
  resolvePublishAt(editorialStatus: AggregatorEditorialStatus, publishMode: AggregatorPublishMode): Date | null {
    if (editorialStatus === 'accepted' && publishMode === 'auto_publish') {
      return new Date();
    }

    return null;
  },
};
