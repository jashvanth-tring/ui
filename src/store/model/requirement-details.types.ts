import { ReactNode } from 'react';

export interface Requirement {
  id: number | null;
  numberOfPosition: string;
  skill_set: string;
  relExp: string;
  isActive: boolean;
  client: number;
  positionDetails: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface Client {
  id: number;
  location: string;
  clientProfile: {
    id: number;
    clientName: string;
    phoneNumber: string;
    emailId: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number };
  updatedBy: null | { id: number };
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RequirementDetails {
  id: number | null;
  noOfPosition: string | number;
  /** API: JSON array of strings; legacy responses may be a single string */
  skillSet: string | string[] | null;
  relExp: string | number;
  isActive: boolean;
  openDate?: string;
  closeDate?: string;
  remarks?: string;
  statusId?: number;
  status?: { id: number; statusName: string };
  client: {
    location: ReactNode;
    clientName: string;
    clientProfile: any;
    id: number;
  };
  positionDetails: {
    positionName: ReactNode;
    id: number;
    positionDetails: {
      positionName: string;
    };
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
  /** S3 object key when JRF/JD was uploaded via parse flow */
  jrfS3Key?: string | null;
  salaryBudget?: string;
  roleType?: string;
  modeOfWork?: string;
  modeOfInterview?: string;
  accountManager?: string;
  approvedBy?: string;          
  reportingManager?: string;
  priority?: string;
  positionType?: string;
}


export interface RequirementDetail {
  id: number | null;
  noOfPosition: string;
  skillSet: string | string[] | null;
  relExp: string;
  isActive: boolean;
  client: Client; // Changed to use the Client interface
  positionDetails: {
    positionName: ReactNode;
    id: number;
    positionDetails: {
      positionName: string;
    };
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}
export interface CreateRequirement {
  client: {
    id: number;
  };
  position: string;
  noOfPosition: number;
  skillSet: string[];
  relExp: number;
  isActive: boolean;
  openDate?: string;
  closeDate?: string;
  remarks?: string;
  statusId?: number;
  createdBy: {
    id: number | undefined;
  };
  jrfS3Key?: string;
}

export interface UpdateRequirement {
  noOfPosition: string | number;
  skillSet: string[];
  relExp: string | number;
  isActive: boolean;
  client: {
    id: number;
  };
  positionDetails?: {
    id: number;
  };
  updatedBy: { id: number } | null;
  openDate?: string;
  closeDate?: string;
  remarks?: string;
  statusId?: number;
  jrfS3Key?: string;
  salaryBudget?: string;
  roleType?: string;
  modeOfWork?: string;
  modeOfInterview?: string;
  accountManager?: string;
  approvedBy?: string;          
  reportingManager?: string;
  priority?: string;
  positionType?: string;
}

export interface RequirementState {
  requirements: Requirement[];
  statuses: { id: number; statusName: string }[];
  loading: boolean;
  error: string | null;
}

export interface ClientProfile {
  id: number;
  clientName: string;
  phoneNumber: string;
  emailId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  location: string;
  clientProfile: ClientProfile;
  createdAt: string;
  updatedAt: string;
}

export interface PositionDetails {
  id: number;
  positionName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
}

export interface RequirementLoop {
  id: number;
  noOfPosition: string;
  skillSet: string | string[] | null;
  relExp: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: User;
  updatedBy: User | null;
  client: Client;
  positionDetails: PositionDetails;
}

export interface RequirementDetailoop {
  client?: {
    clientProfile?: {
      clientName?: string;
    };
  };
  id: string;
  emailId: string;
  clientName: string;
  skills: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RequirementFilter {
  id: number | null;
  numberOfPosition: string;
  skill_set: string;
  relExp: string;
  isActive: boolean;
  client: {
    location: any;
    clientName: any;
    clientProfile: any;
    id: number;
  };
  positionDetails: {
    positionName: string;
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface RequirementRow {
  id: number;
  clientName: string | null;
  accountManager: string | null;
  requirementName: string | null;
  noOfPositions: number | null;
  ctc: string | null;
  priority: string | null;
  jobRequirementForm: boolean;
  startDate: string | null;
  reopenDate: string | null;
  positionType: string | null;
  aging: number | null;
  remarks: string | null;
  status: string | null;
  statusId: number | null;
  isActive: boolean;
  filledPositions: number | null;
}

export interface RequirementMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequirementState {
  requirements: Requirement[];
  statuses: { id: number; statusName: string }[];
  loading: boolean;
  error: string | null;
  dashboardRows: RequirementRow[];
  dashboardMeta: RequirementMeta | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
}
