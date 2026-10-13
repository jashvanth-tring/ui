import { axiosInstance } from '../axiosSetup';
import { ApiVersions, DailyTrackerRoutes } from '../endpoints';
import { ApiResponse } from '../model';

export interface DailyTrackerUser {
  id: number;
  label: string;
}

export interface DailyTrackerProfileRow {
  rowKey: string;
  clientName: string;
  positionName: string;
  totalProfilesShared: number;
  taCounts: Record<string, number>;
  reqRemarks: string;
  reqChallenges: string;
}

export interface DailyTrackerInterviewRow {
  rowKey: string;
  clientName: string;
  positionName: string;
  interviewScheduled: number;
  interviewHappened: number;
  taCounts: Record<string, number>;
  interviewRemarks: string;
  taExecutiveRemarks: string;
}

export interface DailyTrackerOfferRow {
  rowKey: string;
  candidateName: string;
  clientName: string;
  positionName: string;
  status: string;
  doj: string;
}

export interface DailyTrackerData {
  date: string;
  taUsers: DailyTrackerUser[];
  profileSharedTable: {
    rows: DailyTrackerProfileRow[];
    totals: {
      totalProfilesShared: number;
      taCounts: Record<string, number>;
    };
    taRemarks: Record<string, string>;
  };
  interviewTable: {
    rows: DailyTrackerInterviewRow[];
    totals: {
      interviewScheduled: number;
      interviewHappened: number;
      taCounts: Record<string, number>;
    };
  };
  offerJoinerTable: {
    rows: DailyTrackerOfferRow[];
  };
  edits: Record<string, string>;
}

export const fetchDailyTracker = async (date: string, userIds?: number[]) => {
  let url = `${ApiVersions.V1}${DailyTrackerRoutes.BASE}?date=${encodeURIComponent(date)}`;
  
  if (userIds && userIds.length > 0) {
    url += `&userIds=${userIds.join(',')}`;
  }

  const { data } = await axiosInstance.get<ApiResponse<DailyTrackerData>>(url);
  return data;
};

export const updateDailyTracker = async (
  date: string,
  edits: Record<string, string>,
) => {
  const { data } = await axiosInstance.patch<ApiResponse<DailyTrackerData>>(
    `${ApiVersions.V1}${DailyTrackerRoutes.BASE}?date=${encodeURIComponent(date)}`,
    { edits },
  );
  return data;
};

export const exportDailyTracker = async (
  date: string,
  format: 'xlsx' | 'csv',
  userIds?: number[],
) => {
  const params = new URLSearchParams();
  params.append('date', date);
  params.append('format', format);
  // append selected user ids
  if (userIds && userIds.length > 0) {
    params.append('userIds', userIds.join(','));
  }
  const response = await axiosInstance.get(
    `${ApiVersions.V1}${DailyTrackerRoutes.EXPORT}?${params.toString()}`,
    {
      responseType: 'blob',
    },
  );

  return response;
};

export const connectDailyTrackerStream = (
  date: string,
  onMessage: (
    payload: {
      type: string;
      date: string;
      actorUserId?: number | null;
    },
  ) => void,
) => {
  const session =
    localStorage.getItem(
      'session',
    );

  const accessToken =
    localStorage.getItem(
      'accessToken',
    );

  if (
    !session ||
    !accessToken
  ) {
    return null;
  }

  const parsedSession =
    JSON.parse(
      session,
    ) as {
      userId: number;
    };

  // JWT AuthGuard expects Authorization header,
  // EventSource cannot send custom headers.
  // So pass token in query string and backend must read it for SSE route.

  const url =
    `${import.meta.env.VITE_BACKEND_URL}` +
    `${ApiVersions.V1}` +
    `${DailyTrackerRoutes.BASE}` +
    `/stream` +
    `?date=${encodeURIComponent(
      date,
    )}` +
    `&userId=${encodeURIComponent(
      String(
        parsedSession.userId,
      ),
    )}` +
    `&accessToken=${encodeURIComponent(
      accessToken,
    )}`;

  const source =
    new EventSource(
      url,
    );

  source.onmessage = (
    event,
  ) => {
    try {
      onMessage(
        JSON.parse(
          event.data,
        ),
      );
    } catch (
      error
    ) {
      console.error(
        'Failed to parse daily tracker stream event',
        error,
      );
    }
  };

  source.onerror = (
    error,
  ) => {
    console.error(
      'Daily tracker stream error',
      error,
    );
  };

  return source;
};
