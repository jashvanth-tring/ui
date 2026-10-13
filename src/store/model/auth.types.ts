import { Role } from '.';
import { User } from '.';

export interface SingleSignOn {
  role: Role;
  user: User;
  sessionId: string;
  userID: number;
}

export interface Session {
  userId: number;
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  expiresIn: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  profileImageVersion: number;
}
