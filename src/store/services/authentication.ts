import { axiosInstance } from '../axiosSetup';
import { AuthenticationRoutes, ApiVersions } from '../endpoints';

// Authentication

export const loginUser = (email: string, password: string) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.LOGIN}`,
    { email, password }
  );

export const silentLogin = (sessionId: string, userID: number) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.SILENT_LOGIN}`,
    { sessionId, userID }
  );

export const forgetPassword = (officialEmail: string) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.FORGOT_PASSWORD}`,
    { officialEmail }
  );

export const resetPassword = (oldPassword: string, newPassword: string, userId: number) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.RESET_PASSWORD}`,
    {
      oldPassword,
      newPassword,
      userId,
    }
  );

export const recoverPassword = (newPassword: string) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.RECOVER_PASSWORD}`,
    { newPassword }
  );

export const signOutUser =
  () => {
    const session =
      localStorage.getItem(
        'session',
      );

    const parsedSession =
      session
        ? JSON.parse(session)
        : null;

    const deviceId =
      parsedSession?.deviceId;

    const fcmToken =
      localStorage.getItem(
        'fcm_token',
      );

    return axiosInstance.post(
      `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.LOGOUT}`,
      {},
      {
        headers: {
          'device-id':
            deviceId,
          'fcm-token':
            fcmToken || '',
        },
      },
    );
  };

export const refreshAccessToken = (
  refreshToken: string,
  deviceId: string,
  userId: number,
) =>
  axiosInstance.post(
    `${ApiVersions.V1}${AuthenticationRoutes.AUTHENTICATION}${AuthenticationRoutes.REFRESH_TOKEN}`,
    {
      refreshToken,
      deviceId,
      userId,
    },
  );