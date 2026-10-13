import { axiosInstance } from '../axiosSetup';
import { ApiVersions, CandidateProfileRoutes } from '../endpoints';
import {
  createCandidateProfile,
  UpdateCandidateProfile,
} from '../model/candidate.types';

export const createCandidates = async (payload: createCandidateProfile) => {
  return axiosInstance.post(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}`,
    payload,
  );
};

export const FetchAllCandidates = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILES}`,
  );
};

export const fetchCandidatesPaged = async (
  page: number,
  pageSize: number,
  q?: string,
  signal?: AbortSignal,
) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILES}/paged`,
    {
      params: {
        page,
        pageSize,
        q: q && q.trim().length ? q.trim() : undefined,
      },
      signal,
    },
  );
};

export const getCandidateByIds = async (id: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${id}`,
  );
};

export const UpdateCandidateInds = async (
  id: number,
  payload: UpdateCandidateProfile,
) => {
  return axiosInstance.patch(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${id}`,
    payload,
  );
};

export const archiveCandidate = async (
  id: number,
  updatedBy: { id: number },
) => {
  return axiosInstance.patch(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${id}/archive`,
    { updatedBy },
  );
};

export const getCandidatePipeline = (id: number) =>
  axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${id}/pipeline`,
  );

export const uploadCandidateResume = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance.post(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_UPLOAD}`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
};

export const getCandidateResumePresignedUrl = async (candidateId: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${candidateId}/resume/presigned-url`,
  );
};

export const fetchCandidateResumeFile = async (candidateId: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${candidateId}/resume/file`,
    { responseType: 'arraybuffer' },
  );
};

export const getCandidateMappings = (id: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_PROFILE}/${id}/mappings`
  );
};

// ─── History API ──────────────────────────────────────────────────────────────

export const getCandidateStatusHistoryApi = (
  id: number,
  limit = 30,
  cursor?: string,
) =>
  axiosInstance.get(`/v1/history/candidates/${id}/status`, {
    params: { limit, cursor },
  });

export const getCandidateProfileHistoryApi = (
  id: number,
  limit = 30,
  cursor?: string,
) =>
  axiosInstance.get(`/v1/history/candidates/${id}/profile`, {
    params: { limit, cursor },
  });

  // Fetch all users for admin export modal
export const fetchAllUsersForExport = async () => {
  return axiosInstance.get(`${ApiVersions.V1}/users`);
};

// Export candidates via SP
export const ExportCandidatesSP = async (
  requestedByUserId: number,
  filterUserIds?: number[],
  fromDate?: string,
  toDate?: string,
) => {
  const params: any = {
    requestedBy: requestedByUserId,
  };

  if (filterUserIds && filterUserIds.length > 0) {
    params.filterUserIds = filterUserIds.join(',');
  }

  // add date filters
  if (fromDate) {
    params.fromDate = fromDate;
  }

  if (toDate) {
    params.toDate = toDate;
  }

  console.log('ExportCandidatesSP params:', params);

  return axiosInstance.get(
    `${ApiVersions.V1}${CandidateProfileRoutes.CANDIDATE_EXPORT}`,
    { params }
  );
};