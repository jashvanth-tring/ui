import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { useEffect, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { Button } from '../../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyData {
  month: string;
  year: number;
  monthIndex: number;
  candidates: number;
  requirements: number;
}

export default function CandidateTrendsChart() {
  const themeColor = 'var(--brand)';
  const primaryColor = '#6366f1';
  const secondaryColor = '#94a3b8';
  const { candidates } = useAppSelector((state: RootState) => state.candidatesSelector);
  const { requirements } = useAppSelector((state: RootState) => state.requirementsSelector);

  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [currentRangeStart, setCurrentRangeStart] = useState<Date>(startOfMonth(new Date()));
  const [allMonthsData, setAllMonthsData] = useState<MonthlyData[]>([]);
  useEffect(() => {
    const processData = () => {
      const monthlyMap: Record<string, MonthlyData> = {};

      candidates.forEach((candidate: { date: string | number | Date }) => {
        if (candidate.date) {
          const date = new Date(candidate.date);
          const monthKey = format(date, 'yyyy-MM');
          const monthName = format(date, 'MMM');
          const year = date.getFullYear();
          const monthIndex = date.getMonth();

          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = {
              month: monthName,
              year,
              monthIndex,
              candidates: 0,
              requirements: 0,
            };
          }
          monthlyMap[monthKey].candidates += 1;
        }
      });

      requirements.forEach((req: { createdAt: string | number | Date }) => {
        const reqDate = req.createdAt ? new Date(req.createdAt) : new Date();
        const monthKey = format(reqDate, 'yyyy-MM');
        const monthName = format(reqDate, 'MMM');
        const year = reqDate.getFullYear();
        const monthIndex = reqDate.getMonth();

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: monthName,
            year,
            monthIndex,
            candidates: 0,
            requirements: 0,
          };
        }
        monthlyMap[monthKey].requirements += 1;
      });

      const allData = Object.values(monthlyMap).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
      });

      setAllMonthsData(allData);
      updateDisplayedData(allData, currentRangeStart);
    };

    processData();
  }, [candidates, requirements]);

  const updateDisplayedData = (allData: MonthlyData[], rangeStart: Date) => {
    const rangeEnd = addMonths(rangeStart, 5);
    const monthsInRange: string[] = [];

    let currentMonth = rangeStart;
    while (currentMonth <= rangeEnd) {
      monthsInRange.push(format(currentMonth, 'yyyy-MM'));
      currentMonth = addMonths(currentMonth, 1);
    }

    const rangeData = monthsInRange.map((monthKey) => {
      const existingData = allData.find(
        (d) => `${d.year}-${String(d.monthIndex + 1).padStart(2, '0')}` === monthKey
      );

      if (existingData) return existingData;

      const date = new Date(monthKey + '-01');
      return {
        month: format(date, 'MMM'),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        candidates: 0,
        requirements: 0,
      };
    });

    setChartData(rangeData);
  };

  const navigateMonths = (direction: 'prev' | 'next') => {
    const newRangeStart =
      direction === 'prev' ? subMonths(currentRangeStart, 6) : addMonths(currentRangeStart, 6);

    setCurrentRangeStart(newRangeStart);
    updateDisplayedData(allMonthsData, newRangeStart);
  };

  const canNavigatePrev = () => {
    if (allMonthsData.length === 0) return false;
    const earliestDate = new Date(allMonthsData[0].year, allMonthsData[0].monthIndex, 1);
    return currentRangeStart > earliestDate;
  };

  const canNavigateNext = () => {
    if (allMonthsData.length === 0) return false;
    const latestDate = new Date(
      allMonthsData[allMonthsData.length - 1].year,
      allMonthsData[allMonthsData.length - 1].monthIndex,
      1
    );
    return addMonths(currentRangeStart, 5) < latestDate;
  };

  return (
    <Card className="border border-gray-100 flex-1">
      <CardHeader className="pb-2 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle style={{ color: themeColor }}>Recruitment Trends</CardTitle>
            <CardDescription>
              {format(currentRangeStart, 'MMM yyyy')} -{' '}
              {format(addMonths(currentRangeStart, 5), 'MMM yyyy')}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonths('prev')}
              disabled={!canNavigatePrev()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonths('next')}
              disabled={!canNavigateNext()}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value, name) => {
                  if (name === 'candidates') return [`${value} Candidates`, 'Candidates'];
                  if (name === 'requirements') return [`${value} Positions`, 'Open Positions'];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const dataPoint = chartData.find((d) => d.month === label);
                  return dataPoint ? `${dataPoint.month} ${dataPoint.year}` : label;
                }}
              />
              <Line
                type="monotone"
                dataKey="candidates"
                name="Candidates"
                stroke={primaryColor}
                strokeWidth={2}
                dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: primaryColor, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="requirements"
                name="Open Positions"
                stroke={secondaryColor}
                strokeWidth={2}
                dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: secondaryColor, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
