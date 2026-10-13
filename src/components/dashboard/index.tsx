'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/reducers';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { fetchAllRequirement } from '../../store/action/requirement-details.action';
import type { AppDispatch } from '../../store';
import { fetchStatus } from '../../store/action/status.action';
import { FetchAllCandidate } from '../../store/action/candidate.action';
import { fetchAllRounds } from '../../store/action/round.action';
import { fetchAllUsers } from '../../store/action/users.action';
import RecentCandidates from './hiring-process';

export default function Dashboard() {
  // Global state
  const { user } = useSelector((state: RootState) => state?.authSelector);

  // Local state
  const [currentDate, setCurrentDate] = useState<string>('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const themeColor = 'var(--brand)';

  const handleCreateReq = () => {
    navigate('/requirements');
  };

  useEffect(() => {
    const getCurrentDate = () => {
      const today = new Date();
      const dayOfWeek = today.toLocaleString('en-us', { weekday: 'long' });
      const date = today.toLocaleDateString();
      return `${dayOfWeek}, ${date}`;
    };
    setCurrentDate(getCurrentDate());

    const fetchData = async () => {
      await dispatch(fetchAllRequirement());
      await dispatch(FetchAllCandidate());
      await dispatch(fetchAllRounds());
      await dispatch(fetchAllUsers());
      await dispatch(fetchStatus());
    };

    fetchData();
  }, [dispatch]);

  return (
    <div
      className="w-full p-4 bg-gray-50 max-h-[calc(100vh-55px)]"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold" style={{ color: themeColor }}>
            Welcome, {user.firstName}
          </h1>
          <p className="text-gray-500 text-sm">{currentDate}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCreateReq}
            className="bg-[var(--brand)] hover:bg-[#253750] text-white shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" /> New Requirement
          </Button>
        </div>
      </div>
      <div className="w-full flex flex-col min-h-0 h-[calc(100vh-140px)] overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0">
          <RecentCandidates />
        </div>
      </div>
    </div>
  );
}
