// src/routes.ts
import React from 'react';
import { Roles } from './constants';
import Layout from './components/layout';
import PositionFormData from './components/position-details';
import People from './components/people';
// import Home from './pages/home';
// import Dashboard from './pages/dashboard';
import Home from './pages/home';
const Users = React.lazy(() => import('./pages/users'));
const EmailCampaigns = React.lazy(() => import('./pages/email-campaigns'));
const SettingsPage = React.lazy(() => import('./pages/settings'));
// const StatusForm = React.lazy(() => import('./components/status-form'));
// import Summary from './components/summary';
import JobDetail from './components/jobs/detail';
import Client from './components/client';
import Rounds from './components/round';
import Requirements from './components/requirement';
import SummaryGrid from './components/summary/Summary';
import Jobs from './components/jobs';
import CandidatePipeline from './components/candidate-pipeline';
import LogsPage from './pages/logs';
const DailyTrakerPage = React.lazy(() => import('./pages/daily-tracker'));

export const routes = [
  {
    path: '/',
    component: Layout,
    roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER],
    children: [
      { path: '', component: Home, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
      { path: 'users', component: Users, roles: [Roles.SUPERUSER] },
      {
        path: 'email-campaigns',
        component: EmailCampaigns,
        roles: [Roles.SUPERUSER, Roles.USER],
      },
      {
        path: 'settings',
        component: SettingsPage,
        roles: [Roles.SUPERUSER],
      },
      // { path: 'status', component: StatusForm, roles: [Roles.SUPERUSER] },
      { path: 'requirements', component: Requirements, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
      {
        path: 'candidate-pipeline',
        component: CandidatePipeline,
        roles: [Roles.SUPERUSER, Roles.USER],
      },
      { path: 'Candidates', component: People, roles: [Roles.SUPERUSER, Roles.USER] },
      { path: 'dashboard', component: Home, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
      { path: 'jobs/job-detail/:id', component: JobDetail, roles: [Roles.SUPERUSER, Roles.USER] },
      { path: 'jobs', component: Jobs, roles: [Roles.SUPERUSER, Roles.USER] },
      {
        path: 'summary',
        component: SummaryGrid,
        roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER],
      },
      {
        path: 'daily-tracker',
        component: DailyTrakerPage,
        roles: [Roles.SUPERUSER, Roles.USER],
      },
      { path: 'client', component: Client, roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
      { path: 'role', component: PositionFormData, roles: [Roles.SUPERUSER, Roles.USER] },
      { path: 'round', component: Rounds, roles: [Roles.SUPERUSER, Roles.USER] },
      { path: 'logs', component: LogsPage, roles: [Roles.SUPERUSER, Roles.USER] },
    ],
  },
];

export const navLinks = [
  { name: 'Requirements', path: '/requirements', roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
  { name: 'Master Tracker', path: '/candidate-pipeline', roles: [Roles.SUPERUSER, Roles.USER] },
  { name: 'candidates', path: '/candidates', roles: [Roles.SUPERUSER, Roles.USER] },
  { name: 'Dashboard', path: '/dashboard', roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
  { name: 'Daily Tracker', path: '/daily-tracker', roles: [Roles.SUPERUSER, Roles.USER] },
  { name: 'Jobs', path: '/jobs', roles: [Roles.SUPERUSER, Roles.USER] },
  { name: 'Summary', path: '/summary', roles: [Roles.SUPERUSER, Roles.ACCOUNT_MANAGER] },
  { name: 'Client', path: '/client', roles: [Roles.SUPERUSER, Roles.USER, Roles.ACCOUNT_MANAGER] },
  { name: 'Role', path: '/role', roles: [Roles.SUPERUSER, Roles.USER] },
  { name: 'Round', path: '/round', roles: [Roles.SUPERUSER, Roles.USER] },
  { name: 'Logs', path: '/logs', roles: [Roles.SUPERUSER, Roles.USER] },
];