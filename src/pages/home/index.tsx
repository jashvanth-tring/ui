import React, { useCallback, useEffect,  useRef, useState } from 'react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { DashboardKpiCards } from '../../components/summary/DashboardKpiCards';
import { DashboardCharts } from '../../components/summary/DashboardCharts';
import { UpcomingInterviewsPanel } from '../../components/summary/UpcomingInterviewsPanel';
import type { PerformerData } from '../../components/summary/TopPerformerCard';
import { axiosInstance } from '../../store/axiosSetup';
import { ApiVersions, GapAnalysisAnalysis } from '../../store/endpoints';
import { FeedbackTrackerPanel } from '../../components/summary/FeedbackTrackerPanel';
import {
  fetchDashboardKpis,
  fetchTodayProfilesShared, 
  fetchInterviewsByClient,
  fetchWeeklyTrend,
  fetchRecruiterPerformance,
  fetchInterviewsByClientWeekly,
  fetchWeeklyInterviewCount
} from '../../store/services/dashboard';
import type {
  DashboardKpi,
  InterviewByClient,
  WeeklyInterviewCount,
  WeeklyTrend,
  RecruiterPerformance,
} from '../../store/model/dashboard.types';
import { RequirementPrioritiesPanel } from '../../components/summary/RequirementPrioritiesPanel';
import { useAppSelector } from '../../store';
import type { RootState } from '../../store/reducers';
import { LayoutContainer } from '../../styles/LayoutContainer';
import { Roles } from '../../constants/roles';
import { UserAvatar } from '../../../src/utils/UserAvatar';
import { getAllUsers } from '@/store/services/users';
type Tab = 'upcoming' | 'feedback' | 'requirements';

const Home: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.authSelector) || {};
  const [activeTab, setActiveTab] = useState<Tab>('requirements');
  const [performers, setPerformers] = useState<PerformerData[]>([]);
  const [kpi, setKpi]               = useState<DashboardKpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const [byClient, setByClient] = useState<InterviewByClient[]>([]);
  const [weeklyTrend, setWeeklyTrend]     = useState<WeeklyTrend[]>([]);
  const [recruiterPerf, setRecruiterPerf] = useState<RecruiterPerformance[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [byClientWeekly, setByClientWeekly] = useState<InterviewByClient[]>([]);
  const [weeklyCount, setWeeklyCount] = useState<WeeklyInterviewCount[]>([]);

  const loadKpi = useCallback(async () => {
  setKpiLoading(true);
  try {
    const [kpiRes, dailyRes] = await Promise.all([
      fetchDashboardKpis(),
      fetchTodayProfilesShared(),   // 👈 fetch today's profiles shared
    ]);

    const kpiData = kpiRes?.data?.data ?? null;

    // Extract today's "NO OF PROFILES SHARED" count
    const todayData = dailyRes?.data?.data?.[0];
    const profilesShared =
      todayData?.categories?.find(
        (c: any) => c.categoryName === 'NO OF PROFILES SHARED'
      )?.count ?? 0;

    // Merge into kpi data
    setKpi(kpiData ? { ...kpiData, profilesShared } : null);  
  } catch {
    setKpi(null);
  } finally {
    setKpiLoading(false);
  }
}, []);
  const chartsFetchId = useRef(0);
  const loadCharts = useCallback(async () => {
  const fetchId = ++chartsFetchId.current;
  setChartsLoading(true);
  try {
    const [d1, d2, d3, d4, d5, d6] = await Promise.all([
      fetchInterviewsByClient(),
      fetchWeeklyTrend(),
      fetchRecruiterPerformance(),
      fetchInterviewsByClientWeekly(),
      fetchWeeklyInterviewCount(),
      getAllUsers(),
    ]);

    if (fetchId !== chartsFetchId.current) return;

    setByClient(d1?.data?.data ?? []);
    setWeeklyTrend(d2?.data?.data ?? []);
    setRecruiterPerf(d3?.data?.data ?? []);
    setByClientWeekly(d4?.data?.data ?? []);
    setWeeklyCount(d5?.data?.data ?? []);

    const userList: { id: number; firstName: string; lastName: string }[] =
      d6?.data?.data ?? [];

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

// Monthly range: Apr 01 → Apr 30 (previous month)
const prevMonth = month === 0 ? 11 : month - 1;
const prevMonthYear = month === 0 ? year - 1 : year;
const lastDayOfPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
const monthFrom = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
const monthTo = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;
const todayDate = now.getDate();
// Weekly range: Sunday of current week → today
const dayOfWeek = now.getDay(); // 0=Sun
const weekStartDate = new Date(now);
weekStartDate.setDate(now.getDate() - dayOfWeek);
const weekFrom = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;
const weekTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;

const getOfferedCount = (weeks: any[]): number => {
  let total = 0;
  for (const week of weeks) {
    for (const cat of week.categories ?? []) {
      if (cat.categoryName === 'OFFERED') {
        total += Number(cat.count ?? 0);
        break;
      }
    }
  }
  return total;
};

const perfResults: PerformerData[] = [];

for (const user of userList) {
  try {
    // Two sequential calls — monthly and weekly
    const monthRes = await axiosInstance.get(
      `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.WEEKLY}`,
      { params: { uploadedBy: user.id, from: monthFrom, to: monthTo } },
    );

    const weekRes = await axiosInstance.get(
      `${ApiVersions.V1}${GapAnalysisAnalysis.DATA_ANALYTICS}${GapAnalysisAnalysis.WEEKLY}`,
      { params: { uploadedBy: user.id, from: weekFrom, to: weekTo } },
    );

    const monthlyOffered = getOfferedCount(monthRes?.data?.data ?? []);
    const weeklyOffered = getOfferedCount(weekRes?.data?.data ?? []);

    console.log(`[${user.firstName}] monthly=${monthlyOffered} (${monthFrom}→${monthTo}), weekly=${weeklyOffered} (${weekFrom}→${weekTo})`);

    perfResults.push({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      offeredCount: monthlyOffered,
      offeredCountWeekly: weeklyOffered,
    });
  } catch {
    perfResults.push({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      offeredCount: 0,
      offeredCountWeekly: 0,
    });
  }
}

if (fetchId !== chartsFetchId.current) return;

const sorted = perfResults
  .filter((r) => r.offeredCount > 0 || r.offeredCountWeekly > 0)
  .sort((a, b) => b.offeredCount - a.offeredCount);

setPerformers(sorted);
    if (fetchId !== chartsFetchId.current) return;
  } catch {
    if (fetchId !== chartsFetchId.current) return;
    setByClient([]);
    setWeeklyTrend([]);
    setRecruiterPerf([]);
    setPerformers([]);
  } finally {
    setChartsLoading(false);
  }
}, []);

  useEffect(() => {
    void loadKpi();
    void loadCharts();
  }, [loadKpi, loadCharts]);

  return (
      <LayoutContainer>
      <div className=" flex flex-col gap-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <UserAvatar size="md" />
            <h1 className="text-[20px] font-medium text-slate-900">
              Good day , {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Ta-Track'}
            </h1>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {format(new Date(), 'EEEE, d/M/yyyy')}
            </p>
          </div>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <DashboardKpiCards data={kpi} loading={kpiLoading} />

        {/* ── Tabs + table panels ── */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden border-[#BBDEFB] shadow-sm">

        {/* Tab bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-indigo-50">
          {(['requirements', 'upcoming', 'feedback'] as Tab[])
            .filter((tab) => {
              if (user?.role?.id === Roles.ACCOUNT_MANAGER) {
                return tab === 'requirements';
              }
              return true;
            })
            .map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                  activeTab === tab
                    ? 'text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 bg-transparent'
                )}
                style={
                  activeTab === tab
                    ? { background: '#0D47A1' }
                    : {}
                }
              >
                {tab === 'requirements'
                  ? 'Requirement Priorities'
                  : tab === 'upcoming'
                  ? "Today's Interviews"
                  : 'Previous Interview Feedback'}
              </button>
            ))}
        </div>

        {/* Panel content */}
        <div>
          {activeTab === 'upcoming' && <UpcomingInterviewsPanel variant="dashboard" />}
          {activeTab === 'feedback' && <FeedbackTrackerPanel variant="dashboard" />}
          {activeTab === 'requirements' && <RequirementPrioritiesPanel variant="dashboard" />}
        </div>
      </div>
        {/* ── Charts ── */}
        <DashboardCharts
          byClient={byClient}  
          byClientWeekly={byClientWeekly} 
          weeklyTrend={weeklyTrend}
          weeklyCount={weeklyCount} 
          recruiterPerf={recruiterPerf}
          loading={chartsLoading}
          performers={performers}
        />

      </div>
      </LayoutContainer>
  );
};

export default Home;