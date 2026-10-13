import { axiosInstance } from '../axiosSetup';
import { ApiVersions, AuthenticationRoutes, InviteRoutes, UserRoutes } from '../endpoints';
import { InviteUserPayload } from '../model';

export const getUserById = (userId: number) =>
  axiosInstance.get(`${ApiVersions.V1}${UserRoutes.USER}/${userId}`);

export const getAllUsers = () => axiosInstance.get(`${ApiVersions.V1}${UserRoutes.USERS}`);

/** Fields allowed when updating own profile from the UI */
export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  officialEmail?: string;
  primaryPhone?: string;
  trlId?: string;
  imageURL?: string;
  updatedBy?: number;
  role?: { id: number };
  isActive?: boolean;
}

export const updateUser = (userId: number, payload: UpdateUserProfilePayload) =>
  axiosInstance.patch(`${ApiVersions.V1}${UserRoutes.USER}/${userId}`, payload);

/**
 * Upload profile image to S3 via dedicated endpoint.
 * Returns { success, message, data: { imageURL: string } }
 */
export const uploadProfileImage = (userId: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance.post(
    `${ApiVersions.V1}${UserRoutes.USER}/${userId}/profile-image`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
};

/**
 * Get a presigned S3 URL for the profile image.
 * Returns { success, data: { url, expiresIn } }
 */
export const fetchProfileImagePresignedUrl = (userId: number) =>
  axiosInstance.get(
    `${ApiVersions.V1}${UserRoutes.USER}/${userId}/profile-image/presigned-url`,
  );

export const fetchProfileImageFile = (userId: number) =>
  axiosInstance.get(
    `${ApiVersions.V1}${UserRoutes.USER}/${userId}/profile-image`,
    { responseType: 'blob' },
  );

export const inviteUser = async (payload: InviteUserPayload) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${InviteRoutes.SEND_INVITE}`,
    payload
  );

export const getUserQr = (input: number) =>
  axiosInstance.get(`${ApiVersions.V1}${UserRoutes.INVITE}/${input}`);

