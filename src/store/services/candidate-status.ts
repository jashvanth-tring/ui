import { axiosInstance } from '../axiosSetup';
import { CandidateStatusRoutes } from '../endpoints';

export interface PipelineFilters {
  clientId?: number;
  requirementId?: number;
  statusId?: number;
  userId?: number;
  q?: string;
  fromDate?: string;
  toDate?: string;
}

/** Paginated pipeline rows — single page, server-filtered. */
export const fetchCandidateStatuses = async (
  page = 1,
  limit = 500,
  filters?: PipelineFilters,
) => {
  return axiosInstance.get(CandidateStatusRoutes.CANDIDATE_STATUS, {
    params: {
      page,
      limit,
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
      ...(filters?.requirementId ? { requirementId: filters.requirementId } : {}),
      ...(filters?.statusId ? { statusId: filters.statusId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.q ? { q: filters.q } : {}),
      ...(filters?.fromDate ? { fromDate: filters.fromDate } : {}),
      ...(filters?.toDate ? { toDate: filters.toDate } : {}),
    },
  });
};

/** Aggregated counts grouped by client + requirement (for the left panel). */
export const fetchCandidateAggregates = async (filters?: PipelineFilters) => {
  return axiosInstance.get(
    `${CandidateStatusRoutes.CANDIDATE_STATUS}/aggregates`,
    {
      params: {
        ...(filters?.clientId ? { clientId: filters.clientId } : {}),
        ...(filters?.requirementId ? { requirementId: filters.requirementId } : {}),
        ...(filters?.statusId ? { statusId: filters.statusId } : {}),
        ...(filters?.userId ? { userId: filters.userId } : {}),
        ...(filters?.q ? { q: filters.q } : {}),
        ...(filters?.fromDate ? { fromDate: filters.fromDate } : {}),
        ...(filters?.toDate ? { toDate: filters.toDate } : {}),
      },
    },
  );
};

/**
 * Lightweight filter-options for dropdown population.
 * When clientId is provided, requirements are scoped to that client.
 */
export const fetchFilterOptions = async (clientId?: number) => {
  return axiosInstance.get(
    `${CandidateStatusRoutes.CANDIDATE_STATUS}/filter-options`,
    {
      params: clientId ? { clientId } : {},
    },
  );
};

export const exportPipeline = (params: {
  clientIds?:      number[];
  requirementIds?: number[];
  statusIds?:      number[];
  userIds?:        number[];
  fromDate?:       string;   // 'YYYY-MM-DD'
  toDate?:         string;   // 'YYYY-MM-DD'
  filterBySourceDate?:        boolean;
  filterByProfileSharedDate?: boolean;
}) => {
  const query = new URLSearchParams();

  if (params.clientIds?.length)      query.append('clientIds',      params.clientIds.join(','));
  if (params.requirementIds?.length) query.append('requirementIds', params.requirementIds.join(','));
  if (params.statusIds?.length)      query.append('statusIds',      params.statusIds.join(','));
  if (params.userIds?.length)        query.append('userIds',        params.userIds.join(','));
  if (params.fromDate)               query.append('fromDate',       params.fromDate);
  if (params.toDate)                 query.append('toDate',         params.toDate);
  if (params.filterBySourceDate !== undefined)
    query.append('filterBySourceDate', String(params.filterBySourceDate));
  if (params.filterByProfileSharedDate !== undefined)
    query.append('filterByProfileSharedDate', String(params.filterByProfileSharedDate));

  return axiosInstance.get(
    `${CandidateStatusRoutes.PIPELINE_EXPORT}?${query.toString()}`,
  );
};