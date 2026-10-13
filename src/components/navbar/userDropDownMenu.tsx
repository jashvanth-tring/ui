import React, { useState } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  SxProps,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  PersonOutline as UserNameIcon,
} from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import { User } from '../../store/model';
import { Roles } from '../../constants';
import CustomDialog from '../customized-dialog';
import SendInvite from '../send-invite';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { closeDialog, openDialog } from '../../store/reducers/dialog-state.reducer';
import { logoutUser } from '../../store/action/authentication.action';
import ConfirmationDialog from '../confirmation-dialog';
import LockResetIcon from '@mui/icons-material/LockReset';
import ResetPassword from '../../pages/reset-password';
import { DropdownLink } from '../customized-sidebar';

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

interface UserDropdownMenuProps {
  user: User;
  logo: string;
}

interface DialogState {
  content: React.ReactNode | null;
  title: string;
}

const getDisplayName = (user: User): string => {
  if (user?.firstName || user?.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  }
  return user?.officialEmail || '';
};

const getInitials = (user: User): string => {
  if (user?.firstName || user?.lastName) {
    const firstInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0) : '';
    return (firstInitial + lastInitial).toUpperCase();
  }
  return user?.officialEmail ? user.officialEmail.charAt(0).toUpperCase() : 'U';
};

const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({ user, logo }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { open } = useAppSelector((state: RootState) => state?.dialogSelector);
  const dispatch = useDispatch();

  const [dialogState, setDialogState] = useState<DialogState>({
    content: null,
    title: '',
  });

  const [anchorElUser, setAnchorElUser] = useState<HTMLElement | null>(null);
  const [logoutModel, setLogoutModel] = useState<boolean>(false);

  const dropDownLinks: DropdownLink[] = [
    { name: 'Profile', path: '/home', roles: [Roles.SUPERUSER, Roles.USER] },
    { name: 'Send Invite', path: '/admin', roles: [Roles.SUPERUSER] },
    {
      name: 'Reset Password',
      path: '/reset',
      roles: [Roles.SUPERUSER, Roles.USER],
    },
    { name: 'Logout', path: '/logout', roles: [Roles.SUPERUSER, Roles.USER] },
  ];

  const filteredLinks = dropDownLinks.filter((link) => link?.roles?.includes(user?.role?.id));

  const mainLinks = filteredLinks.filter((link) => link.name !== 'Logout');
  const logoutLinks = filteredLinks.filter((link) => link.name === 'Logout');

  const menuItemHoverStyle: SxProps<Theme> = {
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)',
      transition: 'background-color 0.3s ease',
    },
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseDialog = async () => {
    await dispatch(closeDialog());
    await setDialogState({
      content: null,
      title: '',
    });
  };

  const handleLogout = () => {
    <Navigate to="/login" />;
    dispatch(logoutUser()).unwrap();
  };

  const handleMenuItemClick = async (link: DropdownLink) => {
    await handleCloseUserMenu();
    await dispatch(openDialog());

    if (link.path === '/admin') {
      await setDialogState({
        content: <SendInvite />,
        title: 'Send Invite',
      });
    } else if (link.path === '/home') {
      // Handle profile logic (if needed)
    } else if (link.path === '/reset') {
      await setDialogState({
        content: <ResetPassword />,
        title: 'Reset Password',
      });
    } else if (link.path === '/logout') {
      // Handle logout logic
    }
  };

  const displayName = getDisplayName(user);
  const userInitial = getInitials(user);

  return (
    <>
      <Box sx={{ flexGrow: 0 }}>
        {/* User Avatar and Name Section */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleOpenUserMenu}>
          {!isMobile && (
            <span className="hidden md:block text-sm font-medium truncate max-w-[150px]">
              {displayName}
            </span>
          )}
          <IconButton sx={{ p: 0 }}>
            <Avatar
              alt={userInitial}
              src={logo}
              sx={{
                width: '25px',
                height: '25px',
                backgroundColor: 'white',
                color: '#000',
                fontWeight: 600,
                fontSize: '.9rem',
              }}
            >
              {userInitial}
            </Avatar>
          </IconButton>
        </div>

        {/* Dropdown Menu */}
        <Menu
          sx={{
            mt: '45px',
            '& .MuiPaper-root': {
              minWidth: 250,
              borderRadius: 2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            },
          }}
          id="menu-appbar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          MenuListProps={{
            autoFocusItem: false,
          }}
        >
          {/* User Info Section (for mobile) */}
          {isMobile && (
            <MenuItem
              sx={{
                cursor: 'default',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <ListItemIcon>
                  <UserNameIcon />
                </ListItemIcon>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {displayName}
                </Typography>
              </Box>
            </MenuItem>
          )}

          {/* User Info Section (for Desktop) */}
          {!isMobile && (
            <MenuItem
              sx={{
                cursor: 'default',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  borderBottom: '1px solid #e5e5e5',
                  marginBottom: '1%',
                }}
              >
                <Avatar
                  alt={userInitial}
                  src={logo}
                  sx={{
                    width: '45px',
                    height: '45px',
                    marginRight: '12px',
                  }}
                >
                  {userInitial}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {displayName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'gray', marginBottom: '10%' }}>
                    {user?.officialEmail}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          )}

          {/* Main Links Section */}
          {mainLinks.map((link) => (
            <MenuItem
              key={link.path}
              onClick={() => handleMenuItemClick(link)}
              sx={menuItemHoverStyle}
            >
              <ListItemIcon>{getIconForMenuItem(link.name)}</ListItemIcon>
              <ListItemText primary={link.name} />
            </MenuItem>
          ))}

          {/* Divider */}
          <Divider
            sx={{
              my: 1,
              mx: 0.6,
              borderColor: 'rgba(0,0,0,0.12)',
              borderWidth: '.02rem',
            }}
          />

          {/* Logout Section */}
          {logoutLinks.map((link) => (
            <MenuItem
              key={link.path}
              onClick={() => setLogoutModel(true)}
              sx={{
                ...menuItemHoverStyle,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'rgba(255,0,0,0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary={link.name} />
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <CustomDialog
        open={open}
        onClose={handleCloseDialog}
        title={dialogState.title}
        content={dialogState.content}
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
    </>
  );
};

export default UserDropdownMenu;
