import { axiosInstance } from '../axiosSetup';
import { ApiVersions, StatusRoutes } from '../endpoints';
import { StatusPayload, StatusUpdatePayload } from '../model';

export const createNewStatus = async (payload: StatusPayload) =>
  axiosInstance.post(`${ApiVersions.V1}${StatusRoutes.STATUS}`, payload);

export const getStatus = () => axiosInstance.get(`${ApiVersions.V1}${StatusRoutes.STATUSES}`);

export const updateExistingStatus = (statusId: number, payload: StatusUpdatePayload) =>
  axiosInstance.patch(`${ApiVersions.V1}${StatusRoutes.STATUS}/${statusId}`, payload);

export const deleteExistingStatus = (statusId: number) =>
  axiosInstance.delete(`${ApiVersions.V1}${StatusRoutes.STATUS}/${statusId}`);
