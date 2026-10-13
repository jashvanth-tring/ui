import { BrowserRouter as Router, Navigate, Route, Routes, } from 'react-router-dom';
import './App.css';
import { ComponentType, Suspense, useEffect, useRef } from 'react';
import Login from './pages/login';
import Loader from './components/loader';
import ScrollToTop from './components/scroll-to-top';
import AxiosInterceptor from './store/axiosSetup';
import { routes } from './routes';
import ProtectedRoute from './components/protected-route';
import { useAppSelector, useDispatch } from './store';
import { RootState } from './store/reducers';
import { fetchAuthState } from './store/action/authentication.action';
import { Roles } from './constants';
import ForgotPassword from './pages/forget-password';
import RecoverPassword from './pages/recover-password';
import CandidateProfile from './pages/CandidateProfile';
import { getFCMToken } from './store/services/firebase';
import { saveFcmToken } from './store/services/notifications';
import { Toaster } from 'react-hot-toast';
import RouteLoader from './components/RouteLoader';
export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  roles: Roles[];
  children?: RouteConfig[];
}

function AppRoutes() {
  const dispatch = useDispatch();
  const publicRoutes = JSON.parse(import.meta.env.VITE_PUBLIC_ROUTES);
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const session = localStorage.getItem('session');
  const parsedSession = session ? JSON.parse(session) : null;
  const hasFetchedAuth = useRef(false);

  useEffect(() => {
    if (!user) return;

    const initFCM = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

      try {
        const registration =
          (await navigator.serviceWorker.getRegistration()) ||
          (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));

        if (!('Notification' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getFCMToken(registration);
        if (!token) return;

        await saveFcmToken(token);
        localStorage.setItem('fcm_token', token);
      } catch (err) {
        console.warn('FCM init skipped or failed:', err);
      }
    };

    void initFCM();
  }, [user]);
/**
   * ✅ AUTH FETCH
   */

  useEffect(() => {
    if (
      !hasFetchedAuth.current &&
      user == null &&
      !isPublicRoute &&
      parsedSession != null
    ) {
      dispatch(fetchAuthState());
      hasFetchedAuth.current = true;
    }
  }, [dispatch, user, isPublicRoute, parsedSession]);

  const renderRoutes = (routesToRender: RouteConfig[] | undefined) => {
    return routesToRender?.map((route) => {
      const { path, component: Component, roles, children } = route;
      return (
        <Route
          key={`${path}-${roles.join(',')}`}
          path={path}
          element={
            <ProtectedRoute roles={roles}>
              <Component />
            </ProtectedRoute>
          }
        >
          {children && renderRoutes(children)}
        </Route>
      );
    });
  };

  return (
    <Suspense fallback={<Loader />}>
      <RouteLoader>
      <Routes>
        {renderRoutes(routes)}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/candidate-profile/:id" element={<CandidateProfile />} />
      </Routes>
      </RouteLoader>
    </Suspense>
  );
}

function App() {
  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      <Router>
        <ScrollToTop>
          <AxiosInterceptor>
            <AppRoutes />
          </AxiosInterceptor>
        </ScrollToTop>
      </Router>
    </>
  );
}

export default App;
