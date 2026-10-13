import { axiosInstance } from '../axiosSetup';
import { ApiVersions, ClientRoutes } from '../endpoints';
import { CreateClient, updateClientsPayload } from '../model/client.types';

// ✅ EXISTING
export const createClientProfile = async (payload: CreateClient) => {
  return axiosInstance.post(`${ApiVersions.V1}${ClientRoutes.CLIENT_PROFILE}`, payload);
};

export const FetchAllClient = async () => {
  return axiosInstance.get(`${ApiVersions.V1}${ClientRoutes.CLIENTS}`);
};

export const updateClient = async (id: number, payload: updateClientsPayload) => {
  return axiosInstance.patch(`${ApiVersions.V1}${ClientRoutes.CLIENT_PROFILE}/${id}`, payload);
};

export const deleteClient = (id: number) => {
  return axiosInstance.delete(`${ApiVersions.V1}${ClientRoutes.CLIENT_PROFILE}/${id}`);
};

// 🔥 NEW (IMPORTANT)
export const uploadClient = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosInstance.post(
    `${ApiVersions.V1}${ClientRoutes.CLIENT_PROFILE}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};