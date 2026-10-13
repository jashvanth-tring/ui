import { axiosInstance } from '../axiosSetup';
import { ApiVersions, RoundRoutes } from '../endpoints';
import { UpdateRound, CreateRound, UpcomingInterviewRow, InterviewFilter } from '../model/round.types';
import { ApiResponse } from '../model/response.types';
import { FeedbackRow } from '../model/feedbackTracker.types';

export const createRound = async (payload: CreateRound) => {
  return axiosInstance.post(`${ApiVersions.V1}${RoundRoutes.ROUND}`, payload);
};

export const fetchAllRound = async () => {
  return axiosInstance.get(`${ApiVersions.V1}${RoundRoutes.ROUNDS}`);
};

export const fetchUpcomingInterviews = async (params?: { from?: string; to?: string; filter?:InterviewFilter   }) => {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.filter) search.set('filter', params.filter);
  const q = search.toString();
  const url = `${ApiVersions.V1}${RoundRoutes.UPCOMING_INTERVIEWS}${q ? `?${q}` : ''}`;
  return axiosInstance.get<ApiResponse<UpcomingInterviewRow[]>>(url);
};

export const updateRound = async (id: number, payload: UpdateRound) => {
  return axiosInstance.patch(`${ApiVersions.V1}${RoundRoutes.ROUNDS}/${id}`, payload);
};

export const deleteRound = (id: number) => {
  return axiosInstance.delete(`${ApiVersions.V1}${RoundRoutes.ROUNDS}/${id}`);
};

export const updateInterviewDate = async (
  id: number,
  payload: { interviewDate: string; updatedBy: { id: number } }
) => {
  return axiosInstance.patch(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/${id}/interview-date`,
    payload
  );
}
export const fetchFeedbackTrackerService = async (params?: { from?: string; to?: string }) => {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to)   search.set('to',   params.to);
  const q   = search.toString();
  const url = `${ApiVersions.V1}${RoundRoutes.FEEDBACK_TRACKER}${q ? `?${q}` : ''}`;
  return axiosInstance.get<ApiResponse<FeedbackRow[]>>(url);
};

export const updateRejectReason = async (
  id: number,
  payload: { rejectReason: string; updatedBy: { id: number } }
) => {
  return axiosInstance.patch<ApiResponse<void>>(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/${id}/rejection-reason`,
    payload
  );
};