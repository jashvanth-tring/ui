import React from 'react';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../store/reducers';
import { useAppSelector } from '../../store';
import Loader from '../loader';

interface ProtectedRouteProps {
  roles: number[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
  const { loading, user } = useAppSelector((state: RootState) => state.authSelector);
  const session = localStorage.getItem('session');
  const parsedSession = session !== null ? JSON.parse(session) : null;
  if (parsedSession == null) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return <Loader />;
  }
  if (!user || !roles?.includes(user?.role?.id)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
export default ProtectedRoute;
