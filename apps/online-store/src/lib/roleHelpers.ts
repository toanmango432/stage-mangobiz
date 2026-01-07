import { AppRole, UserRole } from "@/types/role";
import { createUser, getUserByEmail } from "./authHelpers";

const ROLES_KEY = 'mango-user-roles';

export const getUserRoles = (userId: string): AppRole[] => {
  const roles: UserRole[] = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  return roles.filter(r => r.userId === userId).map(r => r.role);
};

export const hasRole = (userId: string, role: AppRole): boolean => {
  return getUserRoles(userId).includes(role);
};

export const assignRole = (userId: string, role: AppRole): void => {
  const roles: UserRole[] = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  
  // Check if role already exists
  const exists = roles.some(r => r.userId === userId && r.role === role);
  if (!exists) {
    roles.push({ userId, role });
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  }
};

export const removeRole = (userId: string, role: AppRole): void => {
  const roles: UserRole[] = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  const filtered = roles.filter(r => !(r.userId === userId && r.role === role));
  localStorage.setItem(ROLES_KEY, JSON.stringify(filtered));
};

export const initializeAdminAccount = (): void => {
  // Check if admin already exists
  const adminUser = getUserByEmail('admin@mango.com');
  
  if (!adminUser) {
    // Create admin user
    const newAdmin = createUser({
      email: 'admin@mango.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      phone: '(555) 000-0000',
    });
    
    // Assign admin role
    assignRole(newAdmin.id, 'admin');
  } else {
    // Ensure existing admin has admin role
    if (!hasRole(adminUser.id, 'admin')) {
      assignRole(adminUser.id, 'admin');
    }
  }
};
