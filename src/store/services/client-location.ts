import { axiosInstance } from '../axiosSetup';
import { ApiVersions, ClientLocationRoutes } from '../endpoints';
import { createClientLocationPayload } from '../model/client-location.types';

export const createClientLocation = async (payload: createClientLocationPayload) => {
  return axiosInstance.post(`${ApiVersions.V1}${ClientLocationRoutes.CLIENT_LOCATION}`, payload);
};

export const fetchClientLocation = async () => {
  return axiosInstance.get(`${ApiVersions.V1}${ClientLocationRoutes.CLIENT_LOCATIONS}`);
};

export const deleteClientLocation = async (id: number) => {
  return axiosInstance.delete(`${ApiVersions.V1}${ClientLocationRoutes.CLIENT_LOCATION}/${id}`);
};
