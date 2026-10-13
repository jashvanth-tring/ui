import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import DashboardComponent from '../../components/dashboard/index';

const DashboardPage: React.FC = () => {
  //Global state
  const { user } = useSelector((state: RootState) => state?.authSelector);
  if (user.role.id === 1) {
    return <DashboardComponent />;
  } else {
    return <DashboardComponent />;
  }
  return <></>;
};
export default DashboardPage;
