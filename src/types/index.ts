export type UserRole = 'beboer' | 'personale';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
}

export interface RealtimeMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    full_name: string;
    role: UserRole;
  };
}
