import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { GrHomeRounded } from 'react-icons/gr';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
  LockReset as LockResetIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import SendInvite from '../send-invite';
import ConfirmationDialog from '../confirmation-dialog';
import CustomDialog from '../customized-dialog';
import { useDispatch, useAppSelector } from '../../store';
import { closeDialog, openDialog } from '../../store/reducers/dialog-state.reducer';
import { logoutUser } from '../../store/action/authentication.action';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ResetPassword from '../../pages/reset-password';
import { Roles } from '../../constants/roles';
import ProfilePopup from '../../pages/profile';
import { fetchPositionDetails } from '../../store/action/position-details.action';
import { fetchClientLocations } from '../../store/action/client-location.action';
import { RootState } from '../../store/reducers';
import NotificationBell from '../notifications/notificationbell';
import { useProfileImage } from '../../hooks/useProfileImage';
import taTrackerLogo from '../../assets/ta-tracker-logo.png';
import tringappsLogo from '../../assets/tringapps-logo.png';

interface NavbarProps {
  user?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    officialEmail: string;
    avatar?: string;
    imageURL?: string | null;
    role?: { id: number };
  } | null;
}

interface DropdownLink {
  name: string;
  path: string;
  roles: number[];
}

interface NavCategory {
  name: string;
  url: string;
  current: boolean;
  roles: number[];
  dropdown?: {
    name: string;
    url: string;
    role: number;
  }[];
}

interface DialogState {
  content: React.ReactNode;
  title: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface IconMap {
  [key: string]: React.ReactElement;
}

function BrandMark({
  className = '',
  children = 'T',
  ariaHidden = true,
}: {
  className?: string;
  children?: React.ReactNode;
  ariaHidden?: boolean;
}) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--brand)] text-sm font-bold text-white ${className}`}
      aria-hidden={ariaHidden ? true : undefined}
    >
      {children}
    </span>
  );
}

export default function Navbar({ user = null }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [logoutModel, setLogoutModel] = useState(false);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatch = useDispatch();
  const [, setAnyModalOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({
    content: null,
    title: '',
  });

  // ─── Sliding indicator refs ────────────────────────────────────────────────
  const navContainerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const dialogOpen = useAppSelector?.((state) => state?.dialogSelector?.open) || false;

  const currentUserFromStore = useAppSelector((state: RootState) => state.authSelector.user);
  const clientLocations = useAppSelector(
    (state: RootState) => state.clientLocationSelector?.clientLocations,
  );
    const currentUser = user ||
    currentUserFromStore || {
      firstName: '',
      lastName: '',
      officialEmail: 'abc@gmail.com',
      avatar: '/avatars/shadcn.jpg',
      role: { id: 2 },
    };

  const {
    imageUrl: profileImgUrl,
    handleImageError: handleProfileImgError,
  } = useProfileImage(
    (currentUserFromStore as any)?.id ?? (currentUser as any)?.id ?? null,
    (currentUserFromStore as any)?.imageURL ?? (currentUser as any)?.imageURL ?? null,
  );

  const getDisplayName = () => {
    if (currentUser.firstName || currentUser.lastName) {
      return [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ').trim();
    }
    return currentUser.officialEmail || '';
  };

  const dropDownLinks: DropdownLink[] = [
    { name: 'Profile',         path: '/home',            roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
    { name: 'Send Invite',     path: '/admin',           roles: [Roles.SUPERUSER] },
    { name: 'User management', path: '/users',           roles: [Roles.SUPERUSER] },
    { name: 'Email campaigns', path: '/email-campaigns', roles: [Roles.SUPERUSER] },
    { name: 'Settings',        path: '/settings',        roles: [Roles.SUPERUSER] },
    { name: 'Reset Password',  path: '/reset',           roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
    { name: 'Logout',          path: '/logout',          roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
  ];

  const filteredDropDownLinks = dropDownLinks.filter((link) =>
    link.roles.includes(currentUser.role?.id ?? Roles.USER)
  );

  const allNavCategories: NavCategory[] = [
    { name: 'Requirements',  url: '/requirements',      current: false, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
    { name: 'Master Tracker',      url: '/candidate-pipeline', current: false, roles: [Roles.SUPERUSER, Roles.USER] },
    { name: 'Candidates',    url: '/candidates',         current: false, roles: [Roles.SUPERUSER, Roles.USER] },
    { name: 'Analysis',      url: '/summary',            current: false, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
    { name: 'Clients',       url: '/client',             current: false, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
    { name: 'Daily Tracker', url: '/daily-tracker',      current: false, roles: [Roles.SUPERUSER, Roles.USER] },
  ];

  const navCategories = allNavCategories.filter((cat) =>
    cat.roles.includes(currentUser.role?.id ?? Roles.USER)
  );

  // ─── Move the sliding indicator to the active nav item ───────────────────
  const moveSlider = (el: HTMLElement | null) => {
    if (!el || !sliderRef.current || !navContainerRef.current) return;
    const containerLeft = navContainerRef.current.getBoundingClientRect().left;
    const itemRect = el.getBoundingClientRect();
    sliderRef.current.style.left = `${itemRect.left - containerLeft}px`;
    sliderRef.current.style.width = `${itemRect.width}px`;
    sliderRef.current.style.opacity = '1';
  };

useEffect(() => {
  const observer = new MutationObserver(() => {
    const dialog = document.querySelector('[role="dialog"]');
    
    // Exclude table column visibility popover (it's a small popover, not a real modal)
    const isTablePopover = dialog?.closest('[data-radix-popper-content-wrapper]') !== null
      || document.querySelector('[cmdk-root]') !== null;

    const hasModal = 
      (document.querySelector('.MuiModal-root, .MuiDialog-root') !== null) ||
      (dialog !== null && !isTablePopover);

    setAnyModalOpen(hasModal);
  });

  observer.observe(document.body, { childList: true, subtree: false });
  return () => observer.disconnect();
}, []);
  // Run on every route change — find the active item and slide to it
  useEffect(() => {
    const activeIndex = navCategories.findIndex((cat) => isNavActive(cat.url));
    const activeEl = itemRefs.current[activeIndex];
    if (activeEl) {
      // Disable transition on first paint so it snaps into position
      if (sliderRef.current) sliderRef.current.style.transition = 'none';
      moveSlider(activeEl);
      requestAnimationFrame(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition =
            'left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1)';
        }
      });
    } else {
      // No active item — hide slider
      if (sliderRef.current) sliderRef.current.style.opacity = '0';
    }
  }, [location.pathname, navCategories.length]);

  // ─── Side effects ─────────────────────────────────────────────────────────
  const clientLocationsLen = Array.isArray(clientLocations) ? clientLocations.length : 0;

  useEffect(() => {
    if (clientLocationsLen === 0) dispatch(fetchClientLocations());
  }, [dispatch, clientLocationsLen]);

  useEffect(() => {
    dispatch(fetchPositionDetails());
    return () => {
      if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    };
  }, [dispatch]);

  const handleMouseEnter = (index: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setActiveDropdown(index);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setActiveDropdown(null), 300);
  };

  const handleCloseDialog = async () => {
    await dispatch(closeDialog());
    setDialogState({ content: null, title: '' });
  };

  const handleLogout = () => {
    dispatch(logoutUser()).unwrap();
    navigate('/login');
  };

  const handleMenuItemClick = async (link: DropdownLink) => {
    if (link.path === '/admin') {
      await dispatch(openDialog());
      setDialogState({ content: <SendInvite />, title: 'Send Invite', maxWidth: 'sm' });
    } else if (link.path === '/home') {
      await dispatch(openDialog());
      setDialogState({ content: <ProfilePopup onClose={handleCloseDialog} />, title: 'Profile' });
    } else if (link.path === '/users') {
      navigate('/users'); setActiveDropdown(null); setIsMobileMenuOpen(false);
    } else if (link.path === '/email-campaigns') {
      navigate('/email-campaigns'); setActiveDropdown(null); setIsMobileMenuOpen(false);
    } else if (link.path === '/settings') {
      navigate('/settings'); setActiveDropdown(null); setIsMobileMenuOpen(false);
    } else if (link.path === '/reset') {
      await dispatch(openDialog());
      setDialogState({ content: <ResetPassword />, title: 'Reset Password', maxWidth: 'sm' });
    } else if (link.path === '/logout') {
      setLogoutModel(true);
    }
  };

  const getIconForMenuItem = (name: string) => {
    const iconMap: IconMap = {
      Profile: <PersonIcon />,
      'Send Invite': <AdminIcon />,
      'User management': <GroupIcon />,
      'Email campaigns': <EmailIcon />,
      Settings: <SettingsIcon />,
      'Reset Password': <LockResetIcon />,
      Logout: <LogoutIcon />,
    };
    return iconMap[name] || <PersonIcon />;
  };

  const displayName = getDisplayName();
  const userInitial = displayName.charAt(0).toUpperCase();
  const resolvedAvatarSrc = profileImgUrl || currentUser.avatar || null;

  const isNavActive = (url: string) => {
    const p = location.pathname;
    if (url === '/dashboard') return p === '/' || p === '/dashboard';
    return p === url || p.startsWith(`${url}/`);
  };

  return (
    <>
   <nav className={`fixed top-0 z-[50] w-full border-b border-slate-200 bg-white shadow-sm transition-all duration-200 ${
  logoutModel
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100'
}`}>
      <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-4 px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <div className="flex shrink-0 items-center">
          <Link
            to="/dashboard"
            title="Home"
            className="flex items-center rounded-md outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <img
              src={taTrackerLogo}
              alt="TA Tracker - Tringapps"
              className="h-14 w-40 rounded-lg object-contain object-left"
            />
          </Link>
        </div>

        {/* Desktop nav — sliding bottom-line indicator */}
        <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
          {/*
            Outer wrapper: relative + overflow-visible so the absolute slider
            sits at the bottom of the nav items row without shifting any item.
          */}
          <div
            ref={navContainerRef}
            className="relative flex items-center"
            style={{ gap: '4px' }}  // tiny clearance for the 2px line
          >
            {/* The sliding indicator — absolutely positioned, never affects layout */}
            <div
              ref={sliderRef}
              style={{
                position: 'absolute',
                bottom: 0,
                height: 2,
                borderRadius: 2,
                background: 'var(--brand, #378ADD)',
                opacity: 0,
                pointerEvents: 'none',
                // transition is set dynamically in the effect
              }}
            />

            {/* Home icon */}
            <div className="relative">
              <Link
                to="/dashboard"
                title="Home"
                className={`relative flex items-center px-3 py-2 text-sm transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'text-[var(--brand)]'
                    : 'text-slate-400 hover:text-[var(--brand)]'
                }`}
                style={{ transition: 'color 0.2s ease', minWidth: 'max-content' }}
              >
                <GrHomeRounded className="h-4 w-4" />
              </Link>
              {location.pathname === '/dashboard' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: 'var(--brand, #378ADD)' }}
                />
              )}
            </div>

            {navCategories.map((category, index) => (
              <div
                key={category.name}
                className="relative"
                onMouseEnter={() => handleMouseEnter(`nav-${index}`)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
  to={category.url}
  ref={(el) => { itemRefs.current[index] = el; }}
  className={`relative flex items-center px-3 py-2 text-sm ${
    isNavActive(category.url) || category.current
      ? 'text-[var(--brand)]'
      : 'text-slate-500 hover:text-[var(--brand)]'
  }`}
  style={{ transition: 'color 0.2s ease' ,minWidth: 'max-content',}}
  onClick={() => {
    const el = itemRefs.current[index];
    if (el) moveSlider(el);
    if (!category.dropdown) return;
    setActiveDropdown(null);
  }}
>
  {/* Ghost span — always renders at bold weight, reserves max width, invisible */}
  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',  minWidth: 'max-content',   }}>
    <span
      aria-hidden="true"
      style={{
        height: 0,
        overflow: 'hidden',
        visibility: 'hidden',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'block',
        pointerEvents: 'none',
      }}
    >
      {category.name}
    </span>
    <span
      style={{
        fontWeight: isNavActive(category.url) || category.current ? 600 : 400,
        whiteSpace: 'nowrap',
        transition: 'font-weight 0s',
      }}
    >
      {category.name}
    </span>
  </span>
  {category.dropdown && (
    <ChevronDown
      className={`ml-0.5 h-4 w-4 text-slate-400 transition-transform duration-200 ${
        activeDropdown === `nav-${index}` ? 'rotate-180' : ''
      }`}
    />
  )}
</Link>

                {/* Dropdown */}
                {category.dropdown && activeDropdown === `nav-${index}` && (
                  <div
                    className="absolute left-1/2 top-full z-10 mt-1 w-56 -translate-x-1/2 origin-top"
                    onMouseEnter={() => handleMouseEnter(`nav-${index}`)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5">
                      <div className="py-1" role="menu">
                        {category.dropdown.map((item) => (
                          <Link
                            key={item.name}
                            to={item.url}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
                            role="menuitem"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notification bell */}
        <div className="hidden md:flex items-center">
          <NotificationBell />
        </div>

        {/* User dropdown */}
        <div className="hidden shrink-0 items-center md:flex">
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('user-dropdown')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--brand)] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              id="user-menu-button"
            >
              {resolvedAvatarSrc ? (
                <img
                  src={resolvedAvatarSrc}
                  alt={userInitial}
                  className="h-8 w-8 rounded-md object-cover"
                  onError={() => void handleProfileImgError()}
                />
              ) : (
                <BrandMark className="!h-8 !w-8 !text-xs" ariaHidden>
                  {userInitial}
                </BrandMark>
              )}
              <span className="max-w-[200px] truncate font-medium">{displayName}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                  activeDropdown === 'user-dropdown' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeDropdown === 'user-dropdown' && (
              <div
                className="absolute right-0 z-10 mt-2 w-56"
                onMouseEnter={() => handleMouseEnter('user-dropdown')}
                onMouseLeave={handleMouseLeave}
              >
                  <div className="origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5">
                  <div className="py-1" role="menu">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="truncate text-xs text-gray-500">{currentUser.officialEmail}</p>
                    </div>
                    {filteredDropDownLinks.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleMenuItemClick(item)}
                        className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
                        role="menuitem"
                      >
                        <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-gray-500">
                          {getIconForMenuItem(item.name)}
                        </span>
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-center">
                    <img src={tringappsLogo} alt="Tringapps" className="h-4 object-contain" style={{ filter: 'brightness(0) opacity(0.35)' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex shrink-0 items-center md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-[var(--brand)] focus:outline-none"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — simple dot indicator (no sliding needed on mobile) */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 py-2">
            {/* Home link */}
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-2.5 text-base font-medium ${
                location.pathname === '/dashboard'
                  ? 'text-[var(--brand)] border-l-2 border-[var(--brand)] bg-slate-50'
                  : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <GrHomeRounded className="mr-2 h-5 w-5" />
              Home
            </Link>
            {navCategories.map((category, index) => (
              <div key={category.name}>
                <Link
                  to={category.url}
                  className={`flex items-center px-4 py-2.5 text-base font-medium ${
                    isNavActive(category.url) || category.current
                      ? 'text-[var(--brand)] border-l-2 border-[var(--brand)] bg-slate-50'
                      : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'
                  }`}
                  style={{ transition: 'border-color 0.2s ease, color 0.2s ease' }}
                  onClick={(e) => {
                    if (category.dropdown) {
                      e.preventDefault();
                      setActiveDropdown(
                        activeDropdown === `mobile-${index}` ? null : `mobile-${index}`,
                      );
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                >
                  {category.name}
                  {category.dropdown && (
                    <ChevronDown
                      className={`ml-auto h-5 w-5 text-slate-500 ${
                        activeDropdown === `mobile-${index}` ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </Link>
                {category.dropdown && activeDropdown === `mobile-${index}` && (
                  <div className="ml-4 border-l border-slate-200 pl-3">
                    {category.dropdown.map((item) => (
                      <Link
                        key={item.name}
                        to={item.url}
                        className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-[var(--brand)]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 py-3">
            <div className="flex items-center gap-3 px-4 py-2">
              {resolvedAvatarSrc ? (
                <img
                  src={resolvedAvatarSrc}
                  alt={userInitial}
                  className="h-10 w-10 rounded-md object-cover"
                  onError={() => void handleProfileImgError()}
                />
              ) : (
                <BrandMark className="!h-10 !w-10" ariaHidden>
                  {userInitial}
                </BrandMark>
              )}
              <div className="min-w-0">
                <div className="truncate text-base font-medium text-[var(--brand)]">{displayName}</div>
                <div className="truncate text-sm text-slate-500">{currentUser.officialEmail}</div>
              </div>
            </div>
            <div className="mt-1 space-y-0.5">
              {filteredDropDownLinks.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleMenuItemClick(item)}
                  className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)]"
                >
                  <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-slate-500">
                    {getIconForMenuItem(item.name)}
                  </span>
                  {item.name}
                </button>
              ))}
            </div>
            <div className="mt-2 border-t border-slate-200 px-4 py-2 flex items-center justify-center">
              <img src={tringappsLogo} alt="Tringapps" className="h-4 object-contain" style={{ filter: 'brightness(0) opacity(0.35)' }} />
            </div>
          </div>
        </div>
      )}
        </nav>

      <CustomDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={dialogState.title}
        content={dialogState.content}
        maxWidth={dialogState.maxWidth}
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
}
