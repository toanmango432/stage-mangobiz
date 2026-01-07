interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  password?: string;
  communicationPrefs: {
    email: boolean;
    sms: boolean;
  };
  createdAt: string;
}

interface VerificationSession {
  emailOrPhone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const USERS_KEY = 'mango-users';
const VERIFICATION_KEY = 'mango-verification';
const CURRENT_USER_KEY = 'mango-current-user';

// Mock verification codes (always "123456" for demo)
const MOCK_CODE = '123456';
const CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const mockAuthApi = {
  sendVerificationCode: async (emailOrPhone: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const session: VerificationSession = {
      emailOrPhone,
      code: MOCK_CODE,
      expiresAt: Date.now() + CODE_EXPIRY,
      attempts: 0,
    };

    sessionStorage.setItem(VERIFICATION_KEY, JSON.stringify(session));
    console.log(`📧 Mock verification code sent to ${emailOrPhone}: ${MOCK_CODE}`);
    return { success: true };
  },

  verifyCode: async (emailOrPhone: string, code: string): Promise<{ 
    success: boolean; 
    isNewUser: boolean; 
    userId?: string; 
    error?: string 
  }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const sessionData = sessionStorage.getItem(VERIFICATION_KEY);
    if (!sessionData) return { success: false, isNewUser: false, error: 'No verification session found' };

    const session: VerificationSession = JSON.parse(sessionData);

    if (session.emailOrPhone !== emailOrPhone) return { success: false, isNewUser: false, error: 'Email/phone mismatch' };
    if (Date.now() > session.expiresAt) return { success: false, isNewUser: false, error: 'Code expired' };
    if (session.attempts >= 3) return { success: false, isNewUser: false, error: 'Too many attempts' };

    if (code !== session.code) {
      session.attempts++;
      sessionStorage.setItem(VERIFICATION_KEY, JSON.stringify(session));
      return { success: false, isNewUser: false, error: 'Invalid code' };
    }

    const users = mockAuthApi.getAllUsers();
    const existingUser = users.find(u => u.email === emailOrPhone || u.phone === emailOrPhone);

    if (existingUser) {
      mockAuthApi.setCurrentUser(existingUser);
      sessionStorage.removeItem(VERIFICATION_KEY);
      return { success: true, isNewUser: false, userId: existingUser.id };
    }

    return { success: true, isNewUser: true };
  },

  createProfile: async (profileData: {
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    referralCode?: string;
    communicationPrefs: { email: boolean; sms: boolean };
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = mockAuthApi.getAllUsers();
    if (users.find(u => u.email === profileData.email)) {
      return { success: false, error: 'User already exists' };
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: profileData.email,
      phone: profileData.phone,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      dateOfBirth: profileData.dateOfBirth,
      communicationPrefs: profileData.communicationPrefs,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    mockAuthApi.setCurrentUser(newUser);
    sessionStorage.removeItem(VERIFICATION_KEY);
    console.log('✅ New user created:', newUser);

    return { success: true, user: newUser };
  },

  loginWithPassword: async (email: string, password: string): Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string 
  }> => {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const users = mockAuthApi.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return { success: false, error: 'Invalid email or password' };

    mockAuthApi.setCurrentUser(user);
    return { success: true, user };
  },

  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  setCurrentUser: (user: User) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(VERIFICATION_KEY);
  },

  getAllUsers: (): User[] => {
    const usersData = localStorage.getItem(USERS_KEY);
    return usersData ? JSON.parse(usersData) : [];
  },

  seedDemoUsers: () => {
    const existing = mockAuthApi.getAllUsers();
    if (existing.length > 0) return;

    const demoUsers: User[] = [{
      id: 'user-demo-1',
      email: 'demo@example.com',
      phone: '+12709946016',
      firstName: 'Demo',
      lastName: 'User',
      password: 'demo123',
      communicationPrefs: { email: true, sms: true },
      createdAt: new Date().toISOString(),
    }];

    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
    console.log('🌱 Demo users seeded:', demoUsers);
  }
};

mockAuthApi.seedDemoUsers();
