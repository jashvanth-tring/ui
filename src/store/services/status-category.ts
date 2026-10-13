import { axiosInstance } from '../axiosSetup';
import { ApiVersions, StatusCategoryRoutes } from '../endpoints';
import { StatusCategoryPayload, StatusCategoryUpdatePayload } from '../model';

export const createNewStatusCategory = (payload: StatusCategoryPayload) =>
  axiosInstance.post(`${ApiVersions.V1}${StatusCategoryRoutes.STATUS_CATEGORY}`, payload);

export const getStatusCategory = () =>
  axiosInstance.get(`${ApiVersions.V1}${StatusCategoryRoutes.STATUS_CATEGORIES}`);

export const updateExistingStatusCategory = (
  statusCategoryId: number,
  payload: StatusCategoryUpdatePayload
) =>
  axiosInstance.patch(
    `${ApiVersions.V1}${StatusCategoryRoutes.STATUS_CATEGORY}/${statusCategoryId}`,
    payload
  );

export const deleteExistingStatusCategory = (statusCategoryId: number) =>
  axiosInstance.delete(
    `${ApiVersions.V1}${StatusCategoryRoutes.STATUS_CATEGORY}/${statusCategoryId}`
  );
