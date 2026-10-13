'use client';

import {
  ChevronsUpDown,
  // CircleUserRound,
  // LogOut,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './sidebar';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  PersonOutline as UserNameIcon,
} from '@mui/icons-material';
import { closeDialog, openDialog } from '../../store/reducers/dialog-state.reducer';
import SendInvite from '../send-invite';
import ResetPassword from '../../pages/reset-password';
import LockResetIcon from '@mui/icons-material/LockReset';

import ConfirmationDialog from '../confirmation-dialog';
import CustomDialog from '../customized-dialog';
import { useState } from 'react';
import { useAppSelector, useDispatch } from '../../store';
import { Navigate } from 'react-router-dom';
import { logoutUser } from '../../store/action/authentication.action';
import { DropdownLink } from '../customized-sidebar';
import { RootState } from '../../store/reducers';

interface DialogState {
  content: React.ReactNode | null;
  title: string;
}

export function NavUser({
  user,
  dropLink,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  dropLink?: DropdownLink[];
}) {
  const { isMobile } = useSidebar();
  const [dialogState1, setDialogState1] = useState<DialogState>({
    content: null,
    title: '',
  });

  const { open } = useAppSelector((state: RootState) => state?.dialogSelector);
  const [logoutModel, setLogoutModel] = useState<boolean>(false);
  // const [profileModel, setProfileModel] = useState<boolean>(false);
  // const [inviteModel, setInviteModel] = useState<boolean>(false);

  const dispatch = useDispatch();
  const handleCloseDialog = async () => {
    await dispatch(closeDialog());
    await setDialogState1({
      content: null,
      title: '',
    });
  };

  const handleLogout = () => {
    <Navigate to="/login" />;
    dispatch(logoutUser()).unwrap();
  };

  const getIconForMenuItem = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      UserName: <UserNameIcon />,
      Profile: <ProfileIcon />,
      'Send Invite': <AdminIcon />,
      'Reset Password': <LockResetIcon />,
      Logout: <LogoutIcon />,
    };
    return iconMap[name] || <PersonIcon />;
  };
  const handleMenuItemClick = async (link: DropdownLink) => {
    await dispatch(openDialog());

    if (link.path === '/admin') {
      await setDialogState1({
        content: <SendInvite />,
        title: 'Send Invite',
      });
    } else if (link.path === '/home') {
      // Handle profile logic (if needed)
    } else if (link.path === '/reset') {
      await setDialogState1({
        content: <ResetPassword />, // Render the ResetPassword component
        title: 'Reset Password', // Set the dialog title
      });
    } else if (link.path === '/logout') {
      // Handle logout logic
      setLogoutModel(true);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dropLink?.map((link, index) => {
              return (
                <div>
                  {link.path === '/logout' && <DropdownMenuSeparator />}
                  <DropdownMenuItem key={index} onClick={() => handleMenuItemClick(link)}>
                    {getIconForMenuItem(link.name)}
                    {link.name}
                  </DropdownMenuItem>
                </div>
              );
            })}

            {/* <DropdownMenuItem   onClick={() => setProfileModel(true)}>
            <CircleUserRound />
             Profile
            </DropdownMenuItem>
            <DropdownMenuItem   onClick={() => setInviteModel(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-shield-user-icon lucide-shield-user"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M6.376 18.91a6 6 0 0 1 11.249.003"/><circle cx="12" cy="11" r="4"/></svg>
             Send invite
            </DropdownMenuItem>
            <DropdownMenuItem   onClick={() => setLogoutModel(true)}>
              <LogOut />
             Log out
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <CustomDialog
        open={open}
        onClose={handleCloseDialog}
        title={dialogState1.title}
        content={dialogState1.content}
        maxWidth="xs"
      />
      <ConfirmationDialog
        open={logoutModel}
        onCancel={() => setLogoutModel(false)}
        onClose={() => setLogoutModel(false)}
        title="Logout"
        description="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        variant="destructive"
      />
    </SidebarMenu>
  );
}
