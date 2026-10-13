import { axiosInstance } from '../axiosSetup';

export interface LogRecord {
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  [key: string]: unknown;
}

export interface LogsQuery {
  level?: string;
  module?: string;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface LogsResponse {
  data: LogRecord[];
  total: number;
  hasMore: boolean;
}

export const fetchLogs = async (query: LogsQuery = {}): Promise<LogsResponse> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.append(key, String(value));
  });
  const res = await axiosInstance.get(`/v1/logs?${params.toString()}`);
  return res.data;
};

export const fetchLogModules = async (): Promise<string[]> => {
  const res = await axiosInstance.get('/v1/logs/modules');
  return res.data.modules;
};

export const fetchLogDates = async (): Promise<string[]> => {
  const res = await axiosInstance.get('/v1/logs/dates');
  return res.data.dates;
};