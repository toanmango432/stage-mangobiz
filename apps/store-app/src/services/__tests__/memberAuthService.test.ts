/**
 * Member Auth Service Tests
 *
 * Comprehensive unit tests for memberAuthService covering:
 * - Password login with Supabase Auth
 * - PIN login with bcrypt validation
 * - PIN lockout mechanism
 * - Offline grace period checking
 * - Background session validation
 * - Grace checker lifecycle
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import bcrypt from 'bcryptjs';

// ==================== MOCK SETUP ====================

// Mock Supabase client
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
};

const mockSupabaseFrom = vi.fn();

vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSupabaseAuth.signInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSupabaseAuth.signOut(...args),
    },
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Mock SecureStorage
const mockSecureStorage = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@/utils/secureStorage', () => ({
  SecureStorage: {
    get: (...args: unknown[]) => mockSecureStorage.get(...args),
    set: (...args: unknown[]) => mockSecureStorage.set(...args),
    remove: (...args: unknown[]) => mockSecureStorage.remove(...args),
  },
}));

// Mock Redux store
const mockDispatch = vi.fn();
const mockGetState = vi.fn();

vi.mock('@/store', () => ({
  store: {
    dispatch: (...args: unknown[]) => mockDispatch(...args),
    getState: () => mockGetState(),
  },
}));

// Mock bcrypt (we'll test the actual comparison in some tests)
vi.mock('bcryptjs', async () => {
  const actual = await vi.importActual<typeof import('bcryptjs')>('bcryptjs');
  return {
    default: {
      ...actual.default,
      compare: vi.fn(),
      hash: vi.fn(),
    },
    compare: vi.fn(),
    hash: vi.fn(),
  };
});

// ==================== TEST UTILITIES ====================

// Create mock member session
function createMockMemberSession(overrides = {}) {
  return {
    memberId: 'member-123',
    authUserId: 'auth-user-456',
    email: 'test@example.com',
    name: 'Test User',
    role: 'staff',
    storeIds: ['store-1'],
    permissions: {},
    lastOnlineAuth: new Date('2026-01-15T10:00:00Z'),
    sessionCreatedAt: new Date('2026-01-10T10:00:00Z'),
    defaultStoreId: null,
    ...overrides,
  };
}

// Create mock Supabase query builder
function createMockQueryBuilder(data: unknown = null, error: Error | null = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn().mockImplementation((cb) => cb({ data, error })),
  };
  return builder;
}

// ==================== TEST SUITE ====================

describe('memberAuthService', () => {
  let memberAuthService: typeof import('../memberAuthService').memberAuthService;

  // Mock localStorage
  let localStorageMock: Record<string, string> = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-20T10:00:00Z'));

    // Reset localStorage mock
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    });

    // Mock navigator.onLine
    vi.stubGlobal('navigator', { onLine: true });

    // Reset module cache and re-import to get fresh instance
    vi.resetModules();
    const module = await import('../memberAuthService');
    memberAuthService = module.memberAuthService;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    memberAuthService.stopAllGraceCheckers();
  });

  // ==================== loginWithPassword TESTS ====================

  describe('loginWithPassword', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock Supabase auth success
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      // Mock member lookup
      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff',
        status: 'active',
        store_ids: ['store-1'],
        permissions: {},
        pin_hash: null,
        default_store_id: null,
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'members') {
          return createMockQueryBuilder(mockMember);
        }
        return createMockQueryBuilder(null);
      });

      const session = await memberAuthService.loginWithPassword('test@example.com', 'password123');

      expect(session.memberId).toBe('member-123');
      expect(session.email).toBe('test@example.com');
      expect(session.name).toBe('Test User');
      expect(session.role).toBe('staff');
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(
        memberAuthService.loginWithPassword('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    // ==================== INPUT VALIDATION TESTS ====================

    it('should throw error when email is empty', async () => {
      await expect(
        memberAuthService.loginWithPassword('', 'password123')
      ).rejects.toThrow('Email is required');

      // Supabase should not be called
      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should throw error when email is only whitespace', async () => {
      await expect(
        memberAuthService.loginWithPassword('   ', 'password123')
      ).rejects.toThrow('Email is required');

      // Supabase should not be called
      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should throw error when password is empty', async () => {
      await expect(
        memberAuthService.loginWithPassword('test@example.com', '')
      ).rejects.toThrow('Password is required');

      // Supabase should not be called
      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should trim email before sending to Supabase', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff',
        status: 'active',
        store_ids: ['store-1'],
        permissions: {},
        pin_hash: null,
        default_store_id: null,
      };

      mockSupabaseFrom.mockImplementation(() => createMockQueryBuilder(mockMember));

      await memberAuthService.loginWithPassword('  test@example.com  ', 'password123');

      // Supabase should receive trimmed email
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error when email is null or undefined', async () => {
      await expect(
        memberAuthService.loginWithPassword(null as unknown as string, 'password123')
      ).rejects.toThrow('Email is required');

      await expect(
        memberAuthService.loginWithPassword(undefined as unknown as string, 'password123')
      ).rejects.toThrow('Email is required');

      // Supabase should not be called
      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should throw error when email not confirmed', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email not confirmed' },
      });

      await expect(
        memberAuthService.loginWithPassword('test@example.com', 'password')
      ).rejects.toThrow('Please verify your email address before logging in');
    });

    it('should sign out and throw error when member not found', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-789' } },
        error: null,
      });

      mockSupabaseFrom.mockImplementation(() =>
        createMockQueryBuilder(null, new Error('Not found'))
      );

      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await expect(
        memberAuthService.loginWithPassword('test@example.com', 'password')
      ).rejects.toThrow('No member profile linked to this account');

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should throw error when member is deactivated', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        status: 'inactive',
        store_ids: [],
        permissions: {},
      };

      mockSupabaseFrom.mockImplementation(() => createMockQueryBuilder(mockMember));
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await expect(
        memberAuthService.loginWithPassword('test@example.com', 'password')
      ).rejects.toThrow('Your account has been deactivated');

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should cache session and store PIN hash in SecureStorage', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff',
        status: 'active',
        store_ids: ['store-1'],
        permissions: {},
        pin_hash: 'hashed_pin_value',
        default_store_id: null,
      };

      mockSupabaseFrom.mockImplementation(() => createMockQueryBuilder(mockMember));

      // SecureStorage should return the same value that was set (successful verification)
      mockSecureStorage.get.mockResolvedValue('hashed_pin_value');

      await memberAuthService.loginWithPassword('test@example.com', 'password');

      // Check session was cached
      expect(localStorage.setItem).toHaveBeenCalled();

      // Check PIN hash was stored in SecureStorage
      expect(mockSecureStorage.set).toHaveBeenCalledWith('pin_hash_member-123', 'hashed_pin_value');

      // Check verification was performed
      expect(mockSecureStorage.get).toHaveBeenCalledWith('pin_hash_member-123');
    });

    it('should throw error when SecureStorage verification fails during login', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff',
        status: 'active',
        store_ids: ['store-1'],
        permissions: {},
        pin_hash: 'hashed_pin_value',
        default_store_id: null,
      };

      mockSupabaseFrom.mockImplementation(() => createMockQueryBuilder(mockMember));

      // SecureStorage.get returns different value (simulating storage failure)
      mockSecureStorage.get.mockResolvedValue('corrupted_value');

      await expect(
        memberAuthService.loginWithPassword('test@example.com', 'password')
      ).rejects.toThrow('Failed to persist PIN securely');
    });

    it('should throw error when SecureStorage returns null after set during login', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff',
        status: 'active',
        store_ids: ['store-1'],
        permissions: {},
        pin_hash: 'hashed_pin_value',
        default_store_id: null,
      };

      mockSupabaseFrom.mockImplementation(() => createMockQueryBuilder(mockMember));

      // SecureStorage.get returns null (simulating storage failure)
      mockSecureStorage.get.mockResolvedValue(null);

      await expect(
        memberAuthService.loginWithPassword('test@example.com', 'password')
      ).rejects.toThrow('Failed to persist PIN securely');
    });

    it('should throw Authentication timeout when request times out', async () => {
      // Create a promise that never resolves (simulates network hang)
      mockSupabaseAuth.signInWithPassword.mockImplementation(
        () => new Promise(() => {
          // Never resolves - simulates stuck network request
        })
      );

      // Start the login attempt
      const loginPromise = memberAuthService.loginWithPassword('test@example.com', 'password123');

      // Fast-forward time past the AUTH_TIMEOUT_MS (30 seconds)
      vi.advanceTimersByTime(memberAuthService.AUTH_TIMEOUT_MS + 100);

      // The promise should reject with timeout error
      await expect(loginPromise).rejects.toThrow('Authentication timeout');
    });

    it('should complete successfully before timeout', async () => {
      // Mock Supabase auth success
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-user-456' } },
        error: null,
      });

      // Mock member lookup
      const mockMember = {
        id: 'member-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff',
        status: 'active',
        store_ids: ['store-1'],
        permissions: {},
        pin_hash: null,
        default_store_id: null,
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'members') {
          return createMockQueryBuilder(mockMember);
        }
        return createMockQueryBuilder(null);
      });

      // Login should succeed before timeout
      const session = await memberAuthService.loginWithPassword('test@example.com', 'password123');

      expect(session.memberId).toBe('member-123');
    });
  });

  // ==================== loginWithPin TESTS ====================

  describe('loginWithPin', () => {
    beforeEach(() => {
      // Set up cached member
      const mockSession = createMockMemberSession();
      localStorageMock['cached_members_list'] = JSON.stringify([mockSession]);

      // Mock bcrypt compare
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // Mock SecureStorage with PIN hash
      mockSecureStorage.get.mockResolvedValue('$2a$12$hashed_pin_value');
    });

    it('should successfully login with valid PIN', async () => {
      const session = await memberAuthService.loginWithPin('member-123', '1234');

      expect(session.memberId).toBe('member-123');
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', '$2a$12$hashed_pin_value');
    });

    it('should throw error when member not in cache', async () => {
      localStorageMock['cached_members_list'] = JSON.stringify([]);

      await expect(memberAuthService.loginWithPin('unknown-member', '1234')).rejects.toThrow(
        'Member not found in cache'
      );
    });

    it('should throw error when PIN is locked', async () => {
      // Set up lockout
      const lockoutTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      localStorageMock[`pin_lockout_member-123`] = lockoutTime.toString();

      await expect(memberAuthService.loginWithPin('member-123', '1234')).rejects.toThrow(
        /PIN locked. Try again in \d+ minutes/
      );
    });

    it('should throw error when PIN is invalid', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(memberAuthService.loginWithPin('member-123', '9999')).rejects.toThrow(
        /Invalid PIN. \d+ attempts remaining/
      );
    });

    it('should lock PIN after 5 failed attempts', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      // Set 4 previous failed attempts
      localStorageMock[`pin_attempts_member-123`] = '4';

      await expect(memberAuthService.loginWithPin('member-123', '9999')).rejects.toThrow(
        'PIN locked for 15 minutes'
      );

      // Check lockout was set
      expect(localStorageMock[`pin_lockout_member-123`]).toBeDefined();
    });

    it('should clear failed attempts on successful login', async () => {
      localStorageMock[`pin_attempts_member-123`] = '3';

      await memberAuthService.loginWithPin('member-123', '1234');

      expect(localStorage.removeItem).toHaveBeenCalledWith('pin_attempts_member-123');
    });

    it('should throw error when PIN not configured', async () => {
      mockSecureStorage.get.mockResolvedValue(null);

      await expect(memberAuthService.loginWithPin('member-123', '1234')).rejects.toThrow(
        'PIN not configured'
      );
    });

    it('should throw error when offline grace period expired', async () => {
      // Set lastOnlineAuth to 8 days ago (beyond 7-day grace)
      const oldSession = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-10T10:00:00Z'), // 10 days ago
      });
      localStorageMock['cached_members_list'] = JSON.stringify([oldSession]);

      await expect(memberAuthService.loginWithPin('member-123', '1234')).rejects.toThrow(
        'Offline access expired'
      );
    });

    it('should unlock PIN after lockout period expires', async () => {
      // Set lockout that has expired
      const expiredLockout = Date.now() - 1000; // 1 second ago
      localStorageMock[`pin_lockout_member-123`] = expiredLockout.toString();
      localStorageMock[`pin_attempts_member-123`] = '5';

      // Should succeed since lockout expired
      const session = await memberAuthService.loginWithPin('member-123', '1234');
      expect(session.memberId).toBe('member-123');
    });

    it('should throw PIN validation timeout when bcrypt.compare times out', async () => {
      // Create a promise that never resolves (simulates CPU hang from malicious input)
      vi.mocked(bcrypt.compare).mockImplementation(
        () => new Promise(() => {
          // Never resolves - simulates hung bcrypt operation
        }) as Promise<never>
      );

      // Start the login attempt
      const loginPromise = memberAuthService.loginWithPin('member-123', '1234');

      // Allow microtasks to process (async operations before bcrypt.compare)
      await Promise.resolve();

      // Fast-forward time past the BCRYPT_TIMEOUT_MS (5 seconds)
      vi.advanceTimersByTime(memberAuthService.BCRYPT_TIMEOUT_MS + 100);

      // The promise should reject with timeout error
      await expect(loginPromise).rejects.toThrow('PIN validation timeout');
    });

    it('should complete PIN validation successfully before timeout', async () => {
      // bcrypt.compare succeeds quickly
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // PIN login should succeed before timeout
      const session = await memberAuthService.loginWithPin('member-123', '1234');

      expect(session.memberId).toBe('member-123');
    });
  });

  // ==================== setPin TESTS ====================

  describe('setPin', () => {
    beforeEach(() => {
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$12$new_hashed_pin' as never);
      mockSupabaseFrom.mockImplementation(() => createMockQueryBuilder(null, null));
    });

    it('should validate PIN is 4-6 digits', async () => {
      await expect(memberAuthService.setPin('member-123', '123')).rejects.toThrow(
        'PIN must be 4-6 digits'
      );

      await expect(memberAuthService.setPin('member-123', '1234567')).rejects.toThrow(
        'PIN must be 4-6 digits'
      );

      await expect(memberAuthService.setPin('member-123', 'abcd')).rejects.toThrow(
        'PIN must be 4-6 digits'
      );

      await expect(memberAuthService.setPin('member-123', '12ab')).rejects.toThrow(
        'PIN must be 4-6 digits'
      );
    });

    it('should accept valid 4-digit PIN', async () => {
      // SecureStorage.get returns the expected hash (successful verification)
      mockSecureStorage.get.mockResolvedValue('$2a$12$new_hashed_pin');

      await memberAuthService.setPin('member-123', '1234');

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 12);
      expect(mockSecureStorage.set).toHaveBeenCalledWith(
        'pin_hash_member-123',
        '$2a$12$new_hashed_pin'
      );
    });

    it('should accept valid 6-digit PIN', async () => {
      // SecureStorage.get returns the expected hash (successful verification)
      mockSecureStorage.get.mockResolvedValue('$2a$12$new_hashed_pin');

      await memberAuthService.setPin('member-123', '123456');

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 12);
    });

    it('should update database and SecureStorage', async () => {
      // SecureStorage.get returns the expected hash (successful verification)
      mockSecureStorage.get.mockResolvedValue('$2a$12$new_hashed_pin');

      await memberAuthService.setPin('member-123', '5678');

      expect(mockSupabaseFrom).toHaveBeenCalledWith('members');
      expect(mockSecureStorage.set).toHaveBeenCalledWith(
        'pin_hash_member-123',
        '$2a$12$new_hashed_pin'
      );
      // Check verification was performed
      expect(mockSecureStorage.get).toHaveBeenCalledWith('pin_hash_member-123');
    });

    it('should throw error when SecureStorage verification fails after setPin', async () => {
      // SecureStorage.get returns different value (simulating storage failure)
      mockSecureStorage.get.mockResolvedValue('corrupted_hash');

      await expect(memberAuthService.setPin('member-123', '1234')).rejects.toThrow(
        'Failed to persist PIN securely'
      );
    });

    it('should throw error when SecureStorage returns null after setPin', async () => {
      // SecureStorage.get returns null (simulating storage failure)
      mockSecureStorage.get.mockResolvedValue(null);

      await expect(memberAuthService.setPin('member-123', '1234')).rejects.toThrow(
        'Failed to persist PIN securely'
      );
    });
  });

  // ==================== checkOfflineGrace TESTS ====================

  describe('checkOfflineGrace', () => {
    it('should return valid when within grace period', () => {
      const member = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-18T10:00:00Z'), // 2 days ago
      });

      const graceInfo = memberAuthService.checkOfflineGrace(member);

      expect(graceInfo.isValid).toBe(true);
      expect(graceInfo.daysRemaining).toBeGreaterThan(0);
    });

    it('should return invalid when grace period expired', () => {
      const member = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-10T10:00:00Z'), // 10 days ago
      });

      const graceInfo = memberAuthService.checkOfflineGrace(member);

      expect(graceInfo.isValid).toBe(false);
      expect(graceInfo.daysRemaining).toBeLessThan(0);
    });

    it('should calculate correct days remaining', () => {
      // Last online 5 days ago, so 2 days remaining (7-5=2)
      const member = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-15T10:00:00Z'),
      });

      const graceInfo = memberAuthService.checkOfflineGrace(member);

      expect(graceInfo.isValid).toBe(true);
      expect(graceInfo.daysRemaining).toBe(2);
    });

    it('should return exactly 7 days when just authenticated', () => {
      const member = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-20T10:00:00Z'), // Now
      });

      const graceInfo = memberAuthService.checkOfflineGrace(member);

      expect(graceInfo.isValid).toBe(true);
      expect(graceInfo.daysRemaining).toBe(7);
    });
  });

  // ==================== validateSessionInBackground TESTS ====================

  describe('validateSessionInBackground', () => {
    let member: ReturnType<typeof createMockMemberSession>;

    beforeEach(() => {
      member = createMockMemberSession();
    });

    it('should not force logout when member is active', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'members') {
          return createMockQueryBuilder({
            id: 'member-123',
            status: 'active',
            password_changed_at: null,
          });
        }
        if (table === 'member_session_revocations') {
          return createMockQueryBuilder([]);
        }
        return createMockQueryBuilder(null);
      });

      await memberAuthService.validateSessionInBackground(member);

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringContaining('forceLogout') })
      );
    });

    it('should force logout when member is deactivated', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'members') {
          return createMockQueryBuilder({
            id: 'member-123',
            status: 'inactive',
            password_changed_at: null,
          });
        }
        return createMockQueryBuilder(null);
      });

      await memberAuthService.validateSessionInBackground(member);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            reason: 'account_deactivated',
          }),
        })
      );
    });

    it('should force logout when password changed after session created', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'members') {
          return createMockQueryBuilder({
            id: 'member-123',
            status: 'active',
            password_changed_at: '2026-01-15T10:00:00Z', // After session creation
          });
        }
        return createMockQueryBuilder(null);
      });

      await memberAuthService.validateSessionInBackground(member);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            reason: 'password_changed',
          }),
        })
      );
    });

    it('should force logout when session is revoked', async () => {
      const queryResults: Record<string, unknown> = {
        members: {
          id: 'member-123',
          status: 'active',
          password_changed_at: null,
        },
        member_session_revocations: [
          {
            id: 'rev-1',
            revoke_all_before: '2026-01-15T10:00:00Z', // After session creation
          },
        ],
      };

      mockSupabaseFrom.mockImplementation((table: string) => {
        const builder = createMockQueryBuilder(queryResults[table] || null);
        // Override single for members, use direct response for revocations
        if (table === 'member_session_revocations') {
          builder.single = vi.fn().mockResolvedValue({ data: queryResults[table], error: null });
          builder.limit = vi.fn().mockResolvedValue({ data: queryResults[table], error: null });
        }
        return builder;
      });

      await memberAuthService.validateSessionInBackground(member);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            reason: 'session_revoked',
          }),
        })
      );
    });

    it('should handle network errors silently without logout', async () => {
      mockSupabaseFrom.mockImplementation(() =>
        createMockQueryBuilder(null, new Error('Network error'))
      );

      // Should not throw
      await expect(memberAuthService.validateSessionInBackground(member)).resolves.not.toThrow();

      // Should not force logout
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringContaining('forceLogout') })
      );
    });

    it('should update cached session lastOnlineAuth on success', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'members') {
          return createMockQueryBuilder({
            id: 'member-123',
            status: 'active',
            password_changed_at: null,
          });
        }
        if (table === 'member_session_revocations') {
          return {
            ...createMockQueryBuilder([]),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return createMockQueryBuilder(null);
      });

      await memberAuthService.validateSessionInBackground(member);

      // Session should be cached with updated lastOnlineAuth
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  // ==================== startGraceChecker / stopGraceChecker TESTS ====================

  describe('grace checker lifecycle', () => {
    beforeEach(() => {
      // Set up mock state
      mockGetState.mockReturnValue({
        auth: {
          member: { memberId: 'member-123' },
        },
      });

      // Set up cached member
      const mockSession = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-15T10:00:00Z'), // 5 days ago
      });
      localStorageMock['cached_members_list'] = JSON.stringify([mockSession]);
    });

    it('should start grace checker interval', () => {
      memberAuthService.startGraceChecker();

      // Grace checker interval should be set (30 minutes)
      expect(memberAuthService.GRACE_CHECK_INTERVAL_MS).toBe(30 * 60 * 1000);

      // Clean up
      memberAuthService.stopGraceChecker();
    });

    it('should be idempotent - multiple starts do not create multiple intervals', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      memberAuthService.startGraceChecker();
      memberAuthService.startGraceChecker();
      memberAuthService.startGraceChecker();

      // setInterval should only be called once
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      memberAuthService.stopGraceChecker();
    });

    it('should stop grace checker and clear interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      memberAuthService.startGraceChecker();
      memberAuthService.stopGraceChecker();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should dispatch forceLogout when grace expires while offline', () => {
      // Set member's lastOnlineAuth to 8 days ago (expired)
      const expiredSession = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-10T10:00:00Z'), // 10 days ago
      });
      localStorageMock['cached_members_list'] = JSON.stringify([expiredSession]);

      // Set offline
      vi.stubGlobal('navigator', { onLine: false });

      memberAuthService.startGraceChecker();

      // Fast-forward 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            reason: 'offline_grace_expired',
          }),
        })
      );
    });

    it('should not dispatch forceLogout when online even if grace expired', () => {
      // Set member's lastOnlineAuth to 8 days ago (expired)
      const expiredSession = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-10T10:00:00Z'),
      });
      localStorageMock['cached_members_list'] = JSON.stringify([expiredSession]);

      // Set online
      vi.stubGlobal('navigator', { onLine: true });

      memberAuthService.startGraceChecker();

      // Fast-forward 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      // Should not force logout when online
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should stop itself after dispatching forceLogout', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      // Set expired session and offline
      const expiredSession = createMockMemberSession({
        lastOnlineAuth: new Date('2026-01-10T10:00:00Z'),
      });
      localStorageMock['cached_members_list'] = JSON.stringify([expiredSession]);
      vi.stubGlobal('navigator', { onLine: false });

      memberAuthService.startGraceChecker();

      // Fast-forward 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should support multiple members with separate grace checkers', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Set up two members
      const member1 = createMockMemberSession({ memberId: 'member-1' });
      const member2 = createMockMemberSession({ memberId: 'member-2' });
      localStorageMock['cached_members_list'] = JSON.stringify([member1, member2]);

      // Start grace checker for member-1
      memberAuthService.startGraceChecker('member-1');

      // Start grace checker for member-2
      memberAuthService.startGraceChecker('member-2');

      // Should have two separate intervals
      expect(setIntervalSpy).toHaveBeenCalledTimes(2);

      // Clean up
      memberAuthService.stopAllGraceCheckers();
    });

    it('should be idempotent per member - multiple starts for same member do not create multiple intervals', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Start grace checker for same member multiple times
      memberAuthService.startGraceChecker('member-123');
      memberAuthService.startGraceChecker('member-123');
      memberAuthService.startGraceChecker('member-123');

      // Should only create one interval for this member
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      memberAuthService.stopAllGraceCheckers();
    });

    it('should stop specific member grace checker without affecting others', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      // Set up two members
      const member1 = createMockMemberSession({ memberId: 'member-1' });
      const member2 = createMockMemberSession({ memberId: 'member-2' });
      localStorageMock['cached_members_list'] = JSON.stringify([member1, member2]);

      // Start both
      memberAuthService.startGraceChecker('member-1');
      memberAuthService.startGraceChecker('member-2');

      expect(setIntervalSpy).toHaveBeenCalledTimes(2);

      // Stop only member-1
      memberAuthService.stopGraceChecker('member-1');

      // Only one interval should be cleared
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

      // Starting member-1 again should create a new interval
      memberAuthService.startGraceChecker('member-1');

      expect(setIntervalSpy).toHaveBeenCalledTimes(3);

      memberAuthService.stopAllGraceCheckers();
    });

    it('should stop all grace checkers with stopAllGraceCheckers()', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      // Set up two members
      const member1 = createMockMemberSession({ memberId: 'member-1' });
      const member2 = createMockMemberSession({ memberId: 'member-2' });
      localStorageMock['cached_members_list'] = JSON.stringify([member1, member2]);

      // Start both
      memberAuthService.startGraceChecker('member-1');
      memberAuthService.startGraceChecker('member-2');

      // Stop all
      memberAuthService.stopAllGraceCheckers();

      // Both intervals should be cleared
      expect(clearIntervalSpy).toHaveBeenCalledTimes(2);

      // Starting again should work (Map was cleared)
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      memberAuthService.startGraceChecker('member-1');
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should use Redux store memberId when no memberId parameter provided', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Redux store returns member-123
      mockGetState.mockReturnValue({
        auth: {
          member: { memberId: 'member-123' },
        },
      });

      // Start without explicit memberId
      memberAuthService.startGraceChecker();

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      // Starting again without memberId should be idempotent
      memberAuthService.startGraceChecker();
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      // Starting with explicit same memberId should also be idempotent
      memberAuthService.startGraceChecker('member-123');
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      memberAuthService.stopAllGraceCheckers();
    });

    it('should do nothing when startGraceChecker called without memberId and no member in Redux', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Redux store returns no member
      mockGetState.mockReturnValue({
        auth: {
          member: null,
        },
      });

      // Start without explicit memberId
      memberAuthService.startGraceChecker();

      // No interval should be created
      expect(setIntervalSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== PIN FORMAT VALIDATION TESTS ====================

  describe('isValidPinFormat', () => {
    it('should accept 4-digit PIN', () => {
      expect(memberAuthService.isValidPinFormat('1234')).toBe(true);
    });

    it('should accept 5-digit PIN', () => {
      expect(memberAuthService.isValidPinFormat('12345')).toBe(true);
    });

    it('should accept 6-digit PIN', () => {
      expect(memberAuthService.isValidPinFormat('123456')).toBe(true);
    });

    it('should reject 3-digit PIN', () => {
      expect(memberAuthService.isValidPinFormat('123')).toBe(false);
    });

    it('should reject 7-digit PIN', () => {
      expect(memberAuthService.isValidPinFormat('1234567')).toBe(false);
    });

    it('should reject PIN with letters', () => {
      expect(memberAuthService.isValidPinFormat('12ab')).toBe(false);
      expect(memberAuthService.isValidPinFormat('abcd')).toBe(false);
    });

    it('should reject PIN with special characters', () => {
      expect(memberAuthService.isValidPinFormat('12@3')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(memberAuthService.isValidPinFormat('')).toBe(false);
    });
  });

  // ==================== checkPinLockout TESTS ====================

  describe('checkPinLockout', () => {
    it('should return not locked when no lockout set', () => {
      const lockoutInfo = memberAuthService.checkPinLockout('member-123');

      expect(lockoutInfo.isLocked).toBe(false);
      expect(lockoutInfo.remainingMinutes).toBe(0);
    });

    it('should return locked when lockout is active', () => {
      // Set lockout for 10 minutes from now
      const lockoutTime = Date.now() + 10 * 60 * 1000;
      localStorageMock[`pin_lockout_member-123`] = lockoutTime.toString();

      const lockoutInfo = memberAuthService.checkPinLockout('member-123');

      expect(lockoutInfo.isLocked).toBe(true);
      expect(lockoutInfo.remainingMinutes).toBe(10);
    });

    it('should return not locked and clear when lockout expired', () => {
      // Set lockout that expired 1 second ago
      const lockoutTime = Date.now() - 1000;
      localStorageMock[`pin_lockout_member-123`] = lockoutTime.toString();
      localStorageMock[`pin_attempts_member-123`] = '5';

      const lockoutInfo = memberAuthService.checkPinLockout('member-123');

      expect(lockoutInfo.isLocked).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('pin_lockout_member-123');
      expect(localStorage.removeItem).toHaveBeenCalledWith('pin_attempts_member-123');
    });
  });

  // ==================== logout TESTS ====================

  describe('logout', () => {
    it('should stop grace checker', async () => {
      // Set up a member in cache
      const mockSession = createMockMemberSession();
      localStorageMock['cached_members_list'] = JSON.stringify([mockSession]);

      // Start grace checker with explicit memberId
      memberAuthService.startGraceChecker('member-123');

      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await memberAuthService.logout();

      // Verify grace checker was stopped (by checking it can be started again - only 1 new call)
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      memberAuthService.startGraceChecker('member-123');
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear cached session', async () => {
      localStorageMock['member_auth_session'] = JSON.stringify(createMockMemberSession());

      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await memberAuthService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('member_auth_session');
    });

    it('should sign out of Supabase', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await memberAuthService.logout();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  // ==================== CONSTANTS TESTS ====================

  describe('constants', () => {
    it('should export PIN_MAX_ATTEMPTS as 5', () => {
      expect(memberAuthService.PIN_MAX_ATTEMPTS).toBe(5);
    });

    it('should export PIN_LOCKOUT_MINUTES as 15', () => {
      expect(memberAuthService.PIN_LOCKOUT_MINUTES).toBe(15);
    });

    it('should export OFFLINE_GRACE_DAYS as 7', () => {
      expect(memberAuthService.OFFLINE_GRACE_DAYS).toBe(7);
    });

    it('should export GRACE_CHECK_INTERVAL_MS as 30 minutes', () => {
      expect(memberAuthService.GRACE_CHECK_INTERVAL_MS).toBe(30 * 60 * 1000);
    });

    it('should export AUTH_TIMEOUT_MS as 30 seconds', () => {
      expect(memberAuthService.AUTH_TIMEOUT_MS).toBe(30000);
    });

    it('should export BCRYPT_TIMEOUT_MS as 5 seconds', () => {
      expect(memberAuthService.BCRYPT_TIMEOUT_MS).toBe(5000);
    });
  });
});
