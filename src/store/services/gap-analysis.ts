// services/gap-analysis.ts
import { axiosInstance } from '../axiosSetup';
import { ApiVersions, GapAnalysisAnalysis } from '../endpoints';
import {
  updateGapPayload,
  gap_analysis_1,
  gap_analysis_2,
  gap_analysis_3,
} from '../model/gap-analysis.types';
import { ApiResponse } from '../model';
import { AxiosHeaders, RawAxiosRequestHeaders } from 'axios';

interface RequestParams {
  params?: string;
  headers?: RawAxiosRequestHeaders | AxiosHeaders;
}

interface WeeklyDataResponse {
  // Define the actual structure of your weekly data here
  [key: string]: unknown;
}

interface ClientWiseDataResponse {
  // Define the actual structure of your client-wise data here
  [key: string]: unknown;
}

export const fetchGapAnalysisOnes = (params?: RequestParams) => {
  return axiosInstance.get<ApiResponse<gap_analysis_1>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.GAP_ANALYSIS}-1?${params?.params || ''}`,
    {
      headers: params?.headers,
    }
  );
};

export const fetchGapAnalysisTwos = (params?: RequestParams) => {
  return axiosInstance.get<ApiResponse<gap_analysis_2>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.GAP_ANALYSIS}-2?${params?.params || ''}`,
    {
      headers: params?.headers,
    }
  );
};

export const fetchGapAnalysisThrees = (params?: RequestParams) => {
  return axiosInstance.get<ApiResponse<gap_analysis_3>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.GAP_ANALYSIS}-3?${params?.params || ''}`,
    {
      headers: params?.headers,
    }
  );
};

export const fetchWeeklyDataAction = (params?: RequestParams) => {
  return axiosInstance.get<ApiResponse<WeeklyDataResponse>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.WEEKLY}?${params?.params || ''}`,
    {
      headers: params?.headers,
    }
  );
};

export const fetchClientWiseDataAction = (params?: RequestParams) => {
  return axiosInstance.get<ApiResponse<ClientWiseDataResponse>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.CLIENT_WISE_DATA}?${params?.params || ''}`,
    {
      headers: params?.headers,
    }
  );
};

export const fetchDailyDataAction = (params?: RequestParams) => {
  return axiosInstance.get<ApiResponse<WeeklyDataResponse>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.DAILY}?${params?.params || ''}`,
    {
      headers: params?.headers,
    }
  );
};

export const updateGapsAnalysis = (
  payload: updateGapPayload,
  params?: { headers?: RawAxiosRequestHeaders | AxiosHeaders }
) => {
  return axiosInstance.patch<ApiResponse<gap_analysis_1>>(
    `${ApiVersions.V1}${GapAnalysisAnalysis.GAP_ANALYSIS_UPDATE}`,
    payload,
    {
      headers: params?.headers,
    }
  );
};
