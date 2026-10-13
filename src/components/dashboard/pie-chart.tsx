'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '../../store/reducers';
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';

export default function JobsDistributionChart() {
  const { requirements } = useSelector((state: RootState) => state?.requirementsSelector);
  const themeColor = 'var(--brand)';
  const primaryColor = '#6366f1';

  const chartData = [
    {
      name: 'Active',
      //eslint-disable-next-line
      value: requirements.filter((r: { isActive: any }) => r.isActive).length,
      fill: primaryColor,
    },
    {
      name: 'Non-Active',
      //eslint-disable-next-line
      value: requirements.length - requirements.filter((r: { isActive: any }) => r.isActive).length,
      fill: '#94a3b8',
    },
  ];

  return (
    <Card className="border border-gray-100">
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle style={{ color: themeColor }}>Jobs Distribution</CardTitle>
        <CardDescription>Active vs Non-Active jobs</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-6 pt-0 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
          <span className="text-sm">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#94a3b8' }}></div>
          <span className="text-sm">Non-Active</span>
        </div>
      </CardFooter>
    </Card>
  );
}
