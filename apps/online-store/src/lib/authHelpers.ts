import { User, PasswordStrength, LoginActivity } from "@/types/user";

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { checks, strength, score };
};

export const getUserByEmail = (email: string): User | undefined => {
  const users = JSON.parse(localStorage.getItem('mango-users') || '[]');
  return users.find((u: User) => u.email === email);
};

export const getAllUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('mango-users') || '[]');
};

export const saveUser = (user: User): void => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem('mango-users', JSON.stringify(users));
};

export const createUser = (userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}): User => {
  const newUser: User = {
    id: crypto.randomUUID(),
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    memberSince: new Date().toISOString(),
    preferences: {
      notifications: {
        email: true,
        sms: true,
        bookingReminders: true,
        promotional: false,
        newsletter: false,
      },
      communication: {
        preferredMethod: 'email',
        language: 'en',
      },
      service: {
        preferredStaff: [],
        favoriteServices: [],
        timePreference: [],
      },
    },
    addresses: [],
    paymentMethods: [],
  };
  
  saveUser(newUser);
  localStorage.setItem(`password-${newUser.id}`, userData.password);
  
  return newUser;
};

export const verifyPassword = (userId: string, password: string): boolean => {
  const storedPassword = localStorage.getItem(`password-${userId}`);
  return storedPassword === password;
};

export const changePassword = (userId: string, newPassword: string): void => {
  localStorage.setItem(`password-${userId}`, newPassword);
};

export const logLoginActivity = (userId: string, success: boolean): void => {
  const activities = JSON.parse(localStorage.getItem(`login-activity-${userId}`) || '[]');
  const newActivity: LoginActivity = {
    id: crypto.randomUUID(),
    device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    location: 'New York, USA', // Mock location
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    timestamp: new Date().toISOString(),
    success,
  };
  
  activities.unshift(newActivity);
  if (activities.length > 10) activities.pop();
  
  localStorage.setItem(`login-activity-${userId}`, JSON.stringify(activities));
};

export const getLoginActivity = (userId: string): LoginActivity[] => {
  return JSON.parse(localStorage.getItem(`login-activity-${userId}`) || '[]');
};

export const createSession = (userId: string, rememberMe: boolean): void => {
  const sessionData = { userId, timestamp: Date.now() };
  if (rememberMe) {
    localStorage.setItem('mango-session', JSON.stringify(sessionData));
  } else {
    sessionStorage.setItem('mango-session', JSON.stringify(sessionData));
  }
};

export const getSession = (): { userId: string; timestamp: number } | null => {
  const session = localStorage.getItem('mango-session') || sessionStorage.getItem('mango-session');
  return session ? JSON.parse(session) : null;
};

export const clearSession = (): void => {
  localStorage.removeItem('mango-session');
  sessionStorage.removeItem('mango-session');
};
