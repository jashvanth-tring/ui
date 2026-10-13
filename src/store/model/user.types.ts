import { Role } from "./roles.types";

export interface User {
  id?: number;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  officialEmail: string;
  primaryPhone: string | null;
  trlId: string | null;
  imageURL: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  lastLoginTime?: string | null;
}

export interface InviteUserResponse {
  userDetails: User;
}

export interface InviteUserPayload {
  officialEmail: string;
  primaryPhone: string;
  roleId: {
    id: number;
  };
  createdBy: {
    id: number;
  };
  trlId?: string;
}

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}
