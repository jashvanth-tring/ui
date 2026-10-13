import { axiosInstance } from '../axiosSetup';
import { ApiVersions, LocationDetailsRoutes } from '../endpoints';
import { createLocationPayload, updateLocationPayload } from '../model/location.types';

export const createLocations = async (payload: createLocationPayload) => {
  return axiosInstance.post(`${ApiVersions.V1}${LocationDetailsRoutes.LOCATION}`, payload);
};

export const fetchAllLocations = async () => {
  return axiosInstance.get(`${ApiVersions.V1}${LocationDetailsRoutes.LOCATIONS}`);
};

export const updateLocations = async (id: number, payload: updateLocationPayload) => {
  return axiosInstance.patch(`${ApiVersions.V1}${LocationDetailsRoutes.LOCATION}/${id}`, payload);
};

export const deleteLocations = async (id: number) => {
  return axiosInstance.delete(`${ApiVersions.V1}${LocationDetailsRoutes.LOCATION}/${id}`);
};
