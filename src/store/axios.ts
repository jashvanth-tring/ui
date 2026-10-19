import { refreshAccessToken } from './services/authentication';
import { axiosInstance } from './axiosSetup';

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // ------------------------
      // Read values from storage
      // ------------------------
      const refreshToken =
        localStorage.getItem(
          'refreshToken',
        );

      const deviceId =
        localStorage.getItem(
          'deviceId',
        );

      const session =
        localStorage.getItem(
          'session',
        );

      const userId = session
        ? JSON.parse(session)
            .userId
        : null;

      // ------------------------
      // Call API properly
      // ------------------------
      const refreshResponse =
        await refreshAccessToken(
          refreshToken || '',
          deviceId || '',
          userId,
        );

      const newToken =
        refreshResponse.data
          .data.accessToken;

      localStorage.setItem(
        'accessToken',
        newToken,
      );

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return axiosInstance(
        originalRequest,
      );
    }

   throw error;
  },
);