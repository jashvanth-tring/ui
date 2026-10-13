export interface Role {
  id: number;
  roleName: string;
  roleDescription?: string | null;
}

export interface RoleState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}
