/**
 * Unit Tests for Team Settings Validation Schemas
 *
 * Tests Zod schemas for all team entity types.
 */

import { describe, it, expect } from 'vitest';
import {
  TeamMemberProfileSchema,
  ServicePricingSchema,
  CommissionSettingsSchema,
  ShiftSchema,
  WorkingDaySchema,
  RolePermissionsSchema,
  OnlineBookingSettingsSchema,
} from '../schemas';
import {
  validateProfile,
  ValidationError,
  isValidEmail,
  isValidPin,
  isValidTimeFormat,
  safeValidateProfile,
} from '../validate';

// ============================================
// PROFILE SCHEMA TESTS
// ============================================

describe('TeamMemberProfileSchema', () => {
  const validProfile = {
    id: 'profile-1',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
  };

  it('should validate a valid profile', () => {
    const result = TeamMemberProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('should reject empty firstName', () => {
    const result = TeamMemberProfileSchema.safeParse({
      ...validProfile,
      firstName: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = TeamMemberProfileSchema.safeParse({
      ...validProfile,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid email formats', () => {
    const emails = [
      'test@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk',
    ];

    emails.forEach((email) => {
      const result = TeamMemberProfileSchema.safeParse({
        ...validProfile,
        email,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept optional fields as undefined', () => {
    const minimal = {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John',
      email: 'john@example.com',
      phone: '555-1234',
    };
    const result = TeamMemberProfileSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('should reject firstName over 100 characters', () => {
    const result = TeamMemberProfileSchema.safeParse({
      ...validProfile,
      firstName: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// SERVICE PRICING TESTS
// ============================================

describe('ServicePricingSchema', () => {
  const validService = {
    serviceId: 'service-1',
    serviceName: 'Haircut',
    serviceCategory: 'Hair',
    canPerform: true,
    defaultPrice: 50,
    defaultDuration: 30,
  };

  it('should validate valid service pricing', () => {
    const result = ServicePricingSchema.safeParse(validService);
    expect(result.success).toBe(true);
  });

  it('should accept custom price override', () => {
    const result = ServicePricingSchema.safeParse({
      ...validService,
      customPrice: 60,
      customDuration: 45,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative price', () => {
    const result = ServicePricingSchema.safeParse({
      ...validService,
      defaultPrice: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero duration', () => {
    const result = ServicePricingSchema.safeParse({
      ...validService,
      defaultDuration: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should accept commission override between 0-100', () => {
    const result = ServicePricingSchema.safeParse({
      ...validService,
      commissionOverride: 60,
    });
    expect(result.success).toBe(true);
  });

  it('should reject commission override over 100', () => {
    const result = ServicePricingSchema.safeParse({
      ...validService,
      commissionOverride: 150,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// SHIFT & WORKING HOURS TESTS
// ============================================

describe('ShiftSchema', () => {
  it('should validate valid shift times', () => {
    const result = ShiftSchema.safeParse({
      startTime: '09:00',
      endTime: '17:00',
    });
    expect(result.success).toBe(true);
  });

  it('should reject end time before start time', () => {
    const result = ShiftSchema.safeParse({
      startTime: '17:00',
      endTime: '09:00',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid time format', () => {
    const result = ShiftSchema.safeParse({
      startTime: '9:00', // Missing leading zero
      endTime: '17:00',
    });
    expect(result.success).toBe(false);
  });

  it('should reject equal start and end times', () => {
    const result = ShiftSchema.safeParse({
      startTime: '09:00',
      endTime: '09:00',
    });
    expect(result.success).toBe(false);
  });
});

describe('WorkingDaySchema', () => {
  it('should validate valid working day', () => {
    const result = WorkingDaySchema.safeParse({
      dayOfWeek: 1, // Monday
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '17:00' }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid day of week', () => {
    const result = WorkingDaySchema.safeParse({
      dayOfWeek: 7, // Invalid (0-6 only)
      isWorking: true,
      shifts: [],
    });
    expect(result.success).toBe(false);
  });

  it('should accept multiple shifts', () => {
    const result = WorkingDaySchema.safeParse({
      dayOfWeek: 2,
      isWorking: true,
      shifts: [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '17:00' },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// COMMISSION TESTS
// ============================================

describe('CommissionSettingsSchema', () => {
  const validCommission = {
    type: 'percentage' as const,
    basePercentage: 50,
    productCommission: 10,
    tipHandling: 'keep_all' as const,
  };

  it('should validate basic percentage commission', () => {
    const result = CommissionSettingsSchema.safeParse(validCommission);
    expect(result.success).toBe(true);
  });

  it('should validate tiered commission with no gaps', () => {
    const result = CommissionSettingsSchema.safeParse({
      ...validCommission,
      type: 'tiered',
      tiers: [
        { minRevenue: 0, maxRevenue: 1000, percentage: 30 },
        { minRevenue: 1000, maxRevenue: 5000, percentage: 40 },
        { minRevenue: 5000, percentage: 50 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject tiered commission with gaps', () => {
    const result = CommissionSettingsSchema.safeParse({
      ...validCommission,
      type: 'tiered',
      tiers: [
        { minRevenue: 0, maxRevenue: 1000, percentage: 30 },
        { minRevenue: 2000, percentage: 50 }, // Gap between 1000-2000
      ],
    });
    expect(result.success).toBe(false);
  });

  it('should reject percentage over 100', () => {
    const result = CommissionSettingsSchema.safeParse({
      ...validCommission,
      basePercentage: 150,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative percentage', () => {
    const result = CommissionSettingsSchema.safeParse({
      ...validCommission,
      basePercentage: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should accept flat commission type', () => {
    const result = CommissionSettingsSchema.safeParse({
      type: 'flat',
      basePercentage: 0,
      flatAmount: 100,
      productCommission: 0,
      tipHandling: 'keep_all',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// PERMISSIONS TESTS
// ============================================

describe('RolePermissionsSchema', () => {
  const validPermissions = {
    role: 'stylist' as const,
    permissions: [],
    canAccessAdminPortal: false,
    canAccessReports: false,
    canModifyPrices: false,
    canProcessRefunds: false,
    canDeleteRecords: false,
    canManageTeam: false,
    canViewOthersCalendar: true,
    canBookForOthers: false,
    canEditOthersAppointments: false,
    pinRequired: false,
  };

  it('should validate valid permissions', () => {
    const result = RolePermissionsSchema.safeParse(validPermissions);
    expect(result.success).toBe(true);
  });

  it('should accept valid PIN format (4 digits)', () => {
    const result = RolePermissionsSchema.safeParse({
      ...validPermissions,
      pinRequired: true,
      pin: '1234',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid PIN format (6 digits)', () => {
    const result = RolePermissionsSchema.safeParse({
      ...validPermissions,
      pinRequired: true,
      pin: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should reject PIN with less than 4 digits', () => {
    const result = RolePermissionsSchema.safeParse({
      ...validPermissions,
      pinRequired: true,
      pin: '123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject PIN with non-numeric characters', () => {
    const result = RolePermissionsSchema.safeParse({
      ...validPermissions,
      pinRequired: true,
      pin: '12ab',
    });
    expect(result.success).toBe(false);
  });

  it('should validate all role types', () => {
    const roles = [
      'owner',
      'manager',
      'senior_stylist',
      'stylist',
      'junior_stylist',
      'apprentice',
      'receptionist',
      'assistant',
      'nail_technician',
      'esthetician',
      'massage_therapist',
      'barber',
      'colorist',
      'makeup_artist',
    ];

    roles.forEach((role) => {
      const result = RolePermissionsSchema.safeParse({
        ...validPermissions,
        role,
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// ONLINE BOOKING TESTS
// ============================================

describe('OnlineBookingSettingsSchema', () => {
  const validBooking = {
    isBookableOnline: true,
    showOnWebsite: true,
    showOnApp: true,
    maxAdvanceBookingDays: 30,
    minAdvanceBookingHours: 2,
    bufferBetweenAppointments: 15,
    bufferType: 'after' as const,
    allowDoubleBooking: false,
    maxConcurrentAppointments: 1,
    requireDeposit: false,
    autoAcceptBookings: true,
    acceptNewClients: true,
    displayOrder: 0,
  };

  it('should validate valid online booking settings', () => {
    const result = OnlineBookingSettingsSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('should reject maxAdvanceBookingDays over 365', () => {
    const result = OnlineBookingSettingsSchema.safeParse({
      ...validBooking,
      maxAdvanceBookingDays: 400,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative buffer time', () => {
    const result = OnlineBookingSettingsSchema.safeParse({
      ...validBooking,
      bufferBetweenAppointments: -5,
    });
    expect(result.success).toBe(false);
  });

  it('should validate buffer types', () => {
    const bufferTypes = ['before', 'after', 'both'];

    bufferTypes.forEach((bufferType) => {
      const result = OnlineBookingSettingsSchema.safeParse({
        ...validBooking,
        bufferType,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept optional portfolio images', () => {
    const result = OnlineBookingSettingsSchema.safeParse({
      ...validBooking,
      portfolioImages: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid portfolio image URLs', () => {
    const result = OnlineBookingSettingsSchema.safeParse({
      ...validBooking,
      portfolioImages: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// VALIDATION UTILITY TESTS
// ============================================

describe('validateProfile', () => {
  it('should return validated data for valid input', () => {
    const input = {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
    };

    const result = validateProfile(input);
    expect(result.firstName).toBe('John');
  });

  it('should throw ValidationError for invalid input', () => {
    const input = {
      id: 'profile-1',
      firstName: '',
      lastName: 'Doe',
      displayName: 'Doe',
      email: 'invalid',
      phone: '555-1234',
    };

    expect(() => validateProfile(input)).toThrow(ValidationError);
  });
});

describe('safeValidateProfile', () => {
  it('should return success result for valid input', () => {
    const input = {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
    };

    const result = safeValidateProfile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('John');
    }
  });

  it('should return error result for invalid input', () => {
    const input = {
      id: 'profile-1',
      firstName: '',
      lastName: 'Doe',
      displayName: 'Doe',
      email: 'invalid',
      phone: '555-1234',
    };

    const result = safeValidateProfile(input);
    expect(result.success).toBe(false);
  });
});

describe('ValidationError', () => {
  it('should provide field-specific error access', () => {
    try {
      validateProfile({
        id: 'profile-1',
        firstName: '',
        lastName: 'Doe',
        displayName: 'Doe',
        email: 'invalid-email',
        phone: '555-1234',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        expect(error.errors.length).toBeGreaterThan(0);
        const errorMap = error.getErrorMap();
        expect(Object.keys(errorMap).length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================
// UTILITY FUNCTION TESTS
// ============================================

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@missing-local.com')).toBe(false);
    expect(isValidEmail('missing-at-sign.com')).toBe(false);
  });
});

describe('isValidPin', () => {
  it('should return true for valid 4-digit PIN', () => {
    expect(isValidPin('1234')).toBe(true);
  });

  it('should return true for valid 6-digit PIN', () => {
    expect(isValidPin('123456')).toBe(true);
  });

  it('should return false for 3-digit PIN', () => {
    expect(isValidPin('123')).toBe(false);
  });

  it('should return false for 7-digit PIN', () => {
    expect(isValidPin('1234567')).toBe(false);
  });

  it('should return false for non-numeric PIN', () => {
    expect(isValidPin('abcd')).toBe(false);
  });
});

describe('isValidTimeFormat', () => {
  it('should return true for valid HH:mm format', () => {
    expect(isValidTimeFormat('09:00')).toBe(true);
    expect(isValidTimeFormat('23:59')).toBe(true);
    expect(isValidTimeFormat('00:00')).toBe(true);
  });

  it('should return false for invalid formats', () => {
    expect(isValidTimeFormat('9:00')).toBe(false);
    expect(isValidTimeFormat('09:0')).toBe(false);
    expect(isValidTimeFormat('9:0')).toBe(false);
    expect(isValidTimeFormat('09-00')).toBe(false);
  });
});
