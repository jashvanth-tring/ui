import { axiosInstance } from '../axiosSetup';
import { CreateRequirement, UpdateRequirement } from '../model/requirement-details.types';
import { ApiVersions, RequireDetailsRoutes } from '../endpoints';

export const addRequirementDetails = async (payload: CreateRequirement) => {
  return axiosInstance.post(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}`,
    payload
  );
};

export const fetchAllRequirements = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}`
  );
};

export const fetchRequirementDetailsById = async (id: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}/${id}`,
  );
};

export const fetchRequirementsPaged = async (
  page: number,
  pageSize: number,
  q?: string,
  clientId?: number,
  signal?: AbortSignal,
) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}/paged`,
    {
      params: {
        page,
        pageSize,
        q: q && q.trim().length ? q.trim() : undefined,
        clientId: clientId != null && !Number.isNaN(clientId) ? clientId : undefined,
      },
      signal,
    },
  );
};

export const deleteRequirements = (id: number) =>
  axiosInstance.delete(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}/${id}`
  );

export const updateRequirements = async (id: number, payload: UpdateRequirement) => {
  return axiosInstance.patch(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}/${id}`,
    payload
  );

};

export const fetchRequirementStatusesApi = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}/requirements/status`
  );
};

export const uploadJD = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return axiosInstance.post(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.UPLOAD_JD}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

export const getRequirementJrfPresignedUrl = async (requirementId: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}/${requirementId}/jrf/presigned-url`,
  );
};

export const fetchRequirementJrfFile = async (requirementId: number) => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}${RequireDetailsRoutes.REQUIREMENT_DETAIL}/${requirementId}/jrf/file`,
    { responseType: 'arraybuffer' },
  );
};

export const fetchRequirementDashboard = async (
  page: number,
  limit: number,
  fromDate?: string,
  toDate?: string,
) => {
  const params: Record<string, unknown> = { page, limit };
  if (fromDate) params.fromDate = fromDate;  
  if (toDate)   params.toDate   = toDate;    
  return axiosInstance.get(
    `${ApiVersions.V1}${RequireDetailsRoutes.REQUIREMENTS}/requirement-details/dashboard`,
    { params },
  );
};
