export type AppRole = 'user' | 'admin' | 'staff';

export interface UserRole {
  userId: string;
  role: AppRole;
}
