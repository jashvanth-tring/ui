// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import React, { ReactNode, useLayoutEffect } from 'react';

// // Create an Axios instance
// const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_BACKEND_URL,
// });

// interface AxiosInterceptorProps {
//   children: ReactNode;
// }

// const AxiosInterceptor: React.FC<AxiosInterceptorProps> = ({ children }) => {
//   const navigate = useNavigate();

//   useLayoutEffect(() => {
//     let requestInterceptor: number | null = null;
//     let responseInterceptor: number | null = null;

//     const addInterceptors = () => {
//       // Request Interceptor
//       requestInterceptor = axiosInstance.interceptors.request.use(
//         (config) => {
//           const session = localStorage.getItem('session');
//           const searchParams = new URLSearchParams(window.location.search);
//           const resetToken = searchParams.get('resetToken');

//           if (session) {
//             try {
//               const parsedSession = JSON.parse(session);
//               const { userId, token } = parsedSession;

//               if (userId && token) {
//                 config.headers['user-id'] = userId;
//                 config.headers['access-token'] = token;
//               }
//             } catch (error) {
//               console.error('Failed to parse session:', error);
//             }
//           }

//           if (resetToken) {
//             config.headers['resetToken'] = resetToken;
//           }

//           return config;
//         },
//         (error) => {
//           console.error('Request Interceptor Error:', error);
//           return Promise.reject(error);
//         }
//       );

//       // Response Interceptor
//       responseInterceptor = axiosInstance.interceptors.response.use(
//         (response) => response,
//         (error) => {
//           // Ignore intentional request cancellations (AbortController / navigation / StrictMode re-run)
//           if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
//             return Promise.reject(error);
//           }

//           const { response, config } = error;
//           const requiresAuth = config?.headers['user-id'] && config?.headers['access-token'];

//           if (requiresAuth && response && (response.status === 401 || response.status === 403)) {
//             localStorage.clear();
//             navigate('/login');
//           } else {
//             console.error('Response Interceptor Error:', error);
//           }

//           return Promise.reject(error);
//         }
//       );
//     };

//     addInterceptors();

//     // Cleanup interceptors on unmount
//     return () => {
//       if (requestInterceptor !== null) {
//         axiosInstance.interceptors.request.eject(requestInterceptor);
//       }
//       if (responseInterceptor !== null) {
//         axiosInstance.interceptors.response.eject(responseInterceptor);
//       }
//     };
//   }, [navigate]);

//   return <>{children}</>;
// };

// export { axiosInstance };
// export default AxiosInterceptor;
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import React, {
  ReactNode,
  useLayoutEffect,
} from 'react';

import { refreshAccessToken } from './services/authentication';

// -------------------------------------
// Axios Instance
// -------------------------------------
const axiosInstance = axios.create({
  baseURL:
    import.meta.env
      .VITE_BACKEND_URL,
});

interface AxiosInterceptorProps {
  children: ReactNode;
}

const AxiosInterceptor: React.FC<
  AxiosInterceptorProps
> = ({ children }) => {
  const navigate =
    useNavigate();

  useLayoutEffect(() => {
    let requestInterceptor:
      | number
      | null = null;

    let responseInterceptor:
      | number
      | null = null;

    // ---------------------------------
    // Request Interceptor
    // Add Bearer Token
    // ---------------------------------
    requestInterceptor =
      axiosInstance.interceptors.request.use(
        (config) => {
          const session =
            localStorage.getItem(
              'session',
            );

          const searchParams =
            new URLSearchParams(
              window.location.search,
            );

          const resetToken =
            searchParams.get(
              'resetToken',
            );

          if (session) {
            try {
              const parsedSession =
                JSON.parse(
                  session,
                );

              const accessToken =
                parsedSession.accessToken;

              if (
                accessToken
              ) {
                config.headers.Authorization =
                  `Bearer ${accessToken}`;
              }
            } catch (error) {
              console.error(
                'Failed to parse session',
                error,
              );
            }
          }

          // Password Reset Flow
          if (
            resetToken
          ) {
            config.headers.resetToken =
              resetToken;
          }

          return config;
        },
        (error) =>
          Promise.reject(
            error,
          ),
      );

    // ---------------------------------
    // Response Interceptor
    // Auto Refresh on 401
    // ---------------------------------
    responseInterceptor =
      axiosInstance.interceptors.response.use(
        (response) =>
          response,

        async (
          error,
        ) => {
          const originalRequest =
            error.config;

          // Ignore canceled requests
          if (
            axios.isCancel(
              error,
            ) ||
            error?.code ===
              'ERR_CANCELED'
          ) {
            return Promise.reject(
              error,
            );
          }

          // -----------------------------
          // If Access Token Expired
          // -----------------------------
          if (
            error.response
              ?.status ===
              401 &&
            !originalRequest._retry
          ) {
            originalRequest._retry =
              true;

            try {
              const session =
                localStorage.getItem(
                  'session',
                );

              if (
                !session
              ) {
                throw new Error(
                  'No session',
                );
              }

              const parsedSession =
                JSON.parse(
                  session,
                );

              const refreshToken =
                parsedSession.refreshToken;

              const deviceId =
                parsedSession.deviceId;

              const userId =
                parsedSession.userId;

              // -------------------------
              // Call Refresh API
              // -------------------------
              const refreshResponse =
                await refreshAccessToken(
                  refreshToken,
                  deviceId,
                  userId,
                );

              const newAccessToken =
                refreshResponse
                  .data.data
                  .accessToken;

              // -------------------------
              // Update Storage
              // -------------------------
              const updatedSession =
                {
                  ...parsedSession,
                  accessToken:
                    newAccessToken,
                };

              localStorage.setItem(
                'session',
                JSON.stringify(
                  updatedSession,
                ),
              );

              localStorage.setItem(
                'accessToken',
                newAccessToken,
              );

              // -------------------------
              // Retry Failed Request
              // -------------------------
              originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;

              return axiosInstance(
                originalRequest,
              );
            } catch (
              refreshError
            ) {
              localStorage.clear();

              navigate(
                '/login',
              );

              return Promise.reject(
                refreshError,
              );
            }
          }

          // -----------------------------
          // Unauthorized (after retry)
          // or Forbidden — force logout
          // -----------------------------
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            localStorage.clear();
            navigate('/login');
          }

          return Promise.reject(
            error,
          );
        },
      );

    // ---------------------------------
    // Cleanup
    // ---------------------------------
    return () => {
      if (
        requestInterceptor !==
        null
      ) {
        axiosInstance.interceptors.request.eject(
          requestInterceptor,
        );
      }

      if (
        responseInterceptor !==
        null
      ) {
        axiosInstance.interceptors.response.eject(
          responseInterceptor,
        );
      }
    };
  }, [navigate]);

  return <>{children}</>;
};

export {
  axiosInstance,
};

export default AxiosInterceptor;