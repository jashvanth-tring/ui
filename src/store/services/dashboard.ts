import { axiosInstance } from '../axiosSetup';
import { ApiVersions, GapAnalysisAnalysis, RoundRoutes } from '../endpoints';
import { format } from 'date-fns';


export const fetchDashboardKpis = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/dashboard/kpi`
  );
};

export const fetchWeeklyTrend = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/dashboard/weekly-trend`
  );
};

export const fetchRecruiterPerformance = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/dashboard/recruiter-performance`
  );
};

export const fetchInterviewsByClientWeekly = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/dashboard/interviews-by-client-weekly`
  );
};

export const fetchInterviewsByClient = async () => {
  return axiosInstance.get(
    `${ApiVersions.V1}${RoundRoutes.ROUNDS}/dashboard/interviews-by-client`
  );
};

export const fetchWeeklyInterviewCount = async () => {
  return axiosInstance.get(
   `${ApiVersions.V1}${RoundRoutes.ROUNDS}/dashboard/weekly-interview-count`
  );
};

export const fetchTodayProfilesShared = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return axiosInstance.get(
    `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.DAILY}?from=${today}&to=${today}`
  );
};