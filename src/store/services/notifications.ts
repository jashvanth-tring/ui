import { axiosInstance } from "../axiosSetup";

const BASE_URL = "/v1/notifications";

export interface StoredNotification {
  id: number;
  isRead: boolean;
  readAt: string | null;
  userId: number | null;
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    candidateId: number | null;
    userId: number | null;
    actorUserId: number | null;
    route: string | null;
    entityType: string | null;
    entityId: number | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
}

export interface NotificationsResponse {
  notifications: StoredNotification[];
  unreadCount: number;
}

/**
 * SAVE FCM TOKEN
 */
export const saveFcmToken = (token: string) => {
  return axiosInstance.post(`${BASE_URL}/token`, { token });
};

/**
 * REMOVE FCM TOKEN
 */
export const removeFcmToken = (token: string) => {
  return axiosInstance.post(`${BASE_URL}/remove-token`, { token });
};

/**
 * GET ALL NOTIFICATIONS
 */
export const getNotifications = async () => {
  return axiosInstance.get<NotificationsResponse>(`${BASE_URL}`);
};

/**
 * MARK SINGLE NOTIFICATION AS READ
 */
export const markNotificationAsRead = async (id: number) => {
  return axiosInstance.patch(`${BASE_URL}/${id}/read`);
};

/**
 * MARK ALL NOTIFICATIONS AS READ — single bulk call
 */
export const markAllNotificationsAsRead = async () => {
  return axiosInstance.patch(`${BASE_URL}/mark-all-read`);
};
