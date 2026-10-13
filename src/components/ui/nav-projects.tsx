'use client';

import { type LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './sidebar';
import { Link, useLocation } from 'react-router-dom';
import { RootState } from '../../store/reducers';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
export function NavProjects({
  projects,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
    role: number;
  }[];
}) {
  // const { isMobile } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  const isActive = (route: string) => {
    return pathname === route;
  };
  //global state
  const { user } = useSelector((state: RootState) => state?.authSelector);
  const [filProjects, setFilProjects] = useState<
    { name: string; url: string; icon: LucideIcon; role: number }[]
  >([]);

  useEffect(() => {
    if (user.role.id === 1) {
      setFilProjects(projects);
    } else {
      const filteredProjects = projects.filter((item) => item.role !== 1);
      setFilProjects(filteredProjects);
    }
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Application</SidebarGroupLabel>
      <SidebarMenu>
        {filProjects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link to={item.url} className={isActive(item.url) ? 'active-link' : ''}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
