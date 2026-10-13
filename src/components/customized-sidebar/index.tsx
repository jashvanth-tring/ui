'use client';

import * as React from 'react';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  ClipboardPen,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  Proportions,
  Settings2,
  SquareTerminal,
  User,
  UserRoundPen,
  Users,
  Waypoints,
  ScrollText,
} from 'lucide-react';

import { NavProjects } from '../../components/ui/nav-projects';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '../../components/ui/sidebar';
import { TeamSwitcher } from '../ui/team-switcher';
import { NavUser } from '../ui/nav-user';
import { Roles } from '../../constants/roles';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    firstName: string;
    officialEmail: string;
  };
}

export interface DropdownLink {
  name: string;
  path: string;
  roles: number[];
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const data = {
    user: {
      name: props?.user.firstName,
      email: props?.user.officialEmail,
      avatar: '/avatars/shadcn.jpg',
    },
    teams: [
      {
        name: 'Acme Inc',
        logo: GalleryVerticalEnd,
        plan: 'Enterprise',
      },
      {
        name: 'Acme Corp.',
        logo: AudioWaveform,
        plan: 'Startup',
      },
      {
        name: 'Evil Corp.',
        logo: Command,
        plan: 'Free',
      },
    ],
    navMain: [
      {
        title: 'Playground',
        url: '#',
        icon: SquareTerminal,
        isActive: true,
        items: [
          {
            title: 'History',
            url: '#',
          },
          {
            title: 'Starred',
            url: '#',
          },
          {
            title: 'Settings',
            url: '#',
          },
        ],
      },
      {
        title: 'Models',
        url: '#',
        icon: Bot,
        items: [
          {
            title: 'Genesis',
            url: '#',
          },
          {
            title: 'Explorer',
            url: '#',
          },
          {
            title: 'Quantum',
            url: '#',
          },
        ],
      },
      {
        title: 'Documentation',
        url: '#',
        icon: BookOpen,
        items: [
          {
            title: 'Introduction',
            url: '#',
          },
          {
            title: 'Get Started',
            url: '#',
          },
          {
            title: 'Tutorials',
            url: '#',
          },
          {
            title: 'Changelog',
            url: '#',
          },
        ],
      },
      {
        title: 'Settings',
        url: '#',
        icon: Settings2,
        items: [
          {
            title: 'General',
            url: '#',
          },
          {
            title: 'Team',
            url: '#',
          },
          {
            title: 'Billing',
            url: '#',
          },
          {
            title: 'Limits',
            url: '#',
          },
        ],
      },
    ],
    projects: [
      {
        name: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        role: 2,
      },
      {
        name: 'Add designation',
        url: '/role',
        icon: BriefcaseBusiness,
        role: 2,
      },
      {
        name: 'Add client',
        url: '/client',
        icon: UserRoundPen,
        role: 2,
      },
      {
        name: 'Client requirement',
        url: '/requirements',
        icon: ClipboardPen,
        role: 2,
      },
      {
        name: 'Candidate',
        url: '/peoples',
        icon: User,
        role: 2,
      },

      {
        name: 'Round',
        url: '/round',
        icon: Waypoints,
        role: 2,
      },
      {
        name: 'Gap analysis',
        url: '/summary',
        icon: Proportions,
        role: 1,
      },
      {
        name: 'Users',
        url: '/Users',
        icon: Users,
        role: 1,
      },
      {
        name: 'Jobs',
        url: '/jobs',
        icon: Map,
        role: 2,
      },
      {
    name: 'Logs',
    url: '/logs',
    icon: ScrollText,
    role: 1,
  },
    ],
  };

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

  //global state for dialog

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} dropLink={dropDownLinks} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
