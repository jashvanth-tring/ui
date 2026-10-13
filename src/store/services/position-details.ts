import { axiosInstance } from '../axiosSetup';
import { ApiVersions, PositionDetailsRoutes } from '../endpoints';
import { PositionPayload, PositionUpdatePayload } from '../model/position-details.types';

export const addPositionDetails = async (payload: PositionPayload) =>
  axiosInstance.post(`${ApiVersions.V1}${PositionDetailsRoutes.POSITION_DETAIL}`, payload);

export const getPositionDetails = () =>
  axiosInstance.get(`${ApiVersions.V1}${PositionDetailsRoutes.POSITION_DETAILS}`);

export const updatePositionDetails = (id: number, payload: PositionUpdatePayload) =>
  axiosInstance.patch(`${ApiVersions.V1}${PositionDetailsRoutes.POSITION_DETAIL}/${id}`, payload);

export const deletePositionDetails = (id: number) =>
  axiosInstance.delete(`${ApiVersions.V1}${PositionDetailsRoutes.POSITION_DETAIL}/${id}`);
