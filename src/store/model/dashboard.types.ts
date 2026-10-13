export interface dashboardState {
  // eslint-disable-next-line
  dashboard: any[];
  loading: boolean;
  error: string | null;
  profilesShared: number;
}
export interface dashboardTable {
  role: string;
  available: number;
  test: number;
  hired: number;
  total: number;
}
export interface DashboardKpi {
  todayCount: number;
  weekCount: number;
   profilesShared: number;  
  offersThisMonth: number;
}

export interface InterviewByClient {
  client: string;
  count: number;
}

export interface WeeklyTrend {
  week: string;
  scheduled: number;
  completed: number;
}

export interface RecruiterPerformance {
  recruiterName: string;
  count: number;
}

export interface WeeklyInterviewCount {
  week: string;        // "W1 Mar", "W2 Mar" etc
  interviews: number;
}