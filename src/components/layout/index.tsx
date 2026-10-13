import { Outlet } from 'react-router-dom';
import Navbar from '../navbar';
import { SidebarProvider } from '../ui/sidebar.tsx';
// import { AppSidebar } from '../customized-sidebar/index.tsx';
import { useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppSelector((state: RootState) => state.authSelector);

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden">
        <div>{/* <AppSidebar className="w-64" user={user} /> */}</div>
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <div className="flex-shrink-0 bg-white border-b">
          <Navbar user={user} />
        </div>
          {/* Sidebar Trigger (for mobile or toggling purposes) */}

          {children}

          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
