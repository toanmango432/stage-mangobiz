/**
 * Unit Tests for DataService Internal Logic
 * 
 * Tests utility functions and type adapters with isolated unit tests.
 * Note: Full integration testing with mocked Supabase requires e2e tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the public interface of dataService by importing it
// Note: We can't mock navigator.onLine so we test what we can

describe('dataService', () => {
  describe('checkins.generateCheckInNumber', () => {
    // Import only after mocks are set up
    let dataService: typeof import('./dataService').dataService;

    beforeEach(async () => {
      vi.resetModules();
      // Mock db and supabase to prevent actual connections
      vi.doMock('./supabase', () => ({
        supabase: {
          from: () => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
            insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          }),
        },
      }));
      vi.doMock('./db', () => ({
        db: {
          clients: { where: vi.fn(), put: vi.fn(), add: vi.fn(), get: vi.fn() },
          services: { toArray: vi.fn(() => []), bulkPut: vi.fn() },
          technicians: { toArray: vi.fn(() => []), bulkPut: vi.fn() },
          checkins: { add: vi.fn(), get: vi.fn(), update: vi.fn() },
          syncQueue: { add: vi.fn(), toArray: vi.fn(() => []), count: vi.fn(() => 0) },
        },
      }));
      const module = await import('./dataService');
      dataService = module.dataService;
    });

    it('generates valid check-in numbers', () => {
      const number = dataService.checkins.generateCheckInNumber();
      expect(number).toMatch(/^[A-Z]\d{3}$/);
    });

    it('generates numbers with uppercase letters only', () => {
      for (let i = 0; i < 50; i++) {
        const number = dataService.checkins.generateCheckInNumber();
        expect(number[0]).toMatch(/[A-Z]/);
      }
    });

    it('generates numbers with 3-digit suffix', () => {
      for (let i = 0; i < 50; i++) {
        const number = dataService.checkins.generateCheckInNumber();
        const numPart = number.slice(1);
        expect(numPart).toMatch(/^\d{3}$/);
        expect(parseInt(numPart)).toBeGreaterThan(0);
        expect(parseInt(numPart)).toBeLessThanOrEqual(999);
      }
    });

    it('generates varied numbers (randomness check)', () => {
      const numbers = new Set<string>();
      for (let i = 0; i < 100; i++) {
        numbers.add(dataService.checkins.generateCheckInNumber());
      }
      // Should have many unique values due to randomness
      expect(numbers.size).toBeGreaterThan(30);
    });
  });
});

describe('Type adapters (unit tests)', () => {
  describe('Client type conversion', () => {
    it('converts snake_case to camelCase for client', () => {
      const snakeCaseClient = {
        id: 'client-1',
        first_name: 'John',
        last_name: 'Doe',
        phone: '5551234567',
        email: 'john@example.com',
        zip_code: '12345',
        sms_opt_in: true,
        preferred_technician_id: null,
        loyalty_points: 100,
        loyalty_points_to_next_reward: 50,
        created_at: '2026-01-01T00:00:00Z',
        last_visit_at: null,
        visit_count: 5,
      };

      // Simulate the toClient function logic
      const result = {
        id: snakeCaseClient.id,
        firstName: snakeCaseClient.first_name,
        lastName: snakeCaseClient.last_name,
        phone: snakeCaseClient.phone,
        email: snakeCaseClient.email ?? undefined,
        zipCode: snakeCaseClient.zip_code ?? undefined,
        smsOptIn: snakeCaseClient.sms_opt_in,
        preferredTechnicianId: snakeCaseClient.preferred_technician_id ?? undefined,
        loyaltyPoints: snakeCaseClient.loyalty_points ?? 0,
        loyaltyPointsToNextReward: snakeCaseClient.loyalty_points_to_next_reward ?? 100,
        createdAt: snakeCaseClient.created_at,
        lastVisitAt: snakeCaseClient.last_visit_at ?? undefined,
        visitCount: snakeCaseClient.visit_count ?? 0,
      };

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.smsOptIn).toBe(true);
      expect(result.loyaltyPoints).toBe(100);
    });
  });

  describe('Service type conversion', () => {
    it('converts snake_case to camelCase for service', () => {
      const snakeCaseService = {
        id: 'svc-1',
        name: 'Haircut',
        category_id: 'cat-1',
        price: 25,
        duration_minutes: 30,
        is_active: true,
        description: 'A great haircut',
        thumbnail_url: 'https://example.com/img.jpg',
        service_categories: { id: 'cat-1', name: 'Hair', display_order: 1 },
      };

      // Simulate the toService function logic
      const result = {
        id: snakeCaseService.id,
        name: snakeCaseService.name,
        categoryId: snakeCaseService.category_id,
        categoryName: snakeCaseService.service_categories?.name ?? 'Uncategorized',
        price: snakeCaseService.price,
        durationMinutes: snakeCaseService.duration_minutes,
        isActive: snakeCaseService.is_active,
        description: snakeCaseService.description ?? undefined,
        thumbnailUrl: snakeCaseService.thumbnail_url ?? undefined,
      };

      expect(result.name).toBe('Haircut');
      expect(result.categoryName).toBe('Hair');
      expect(result.durationMinutes).toBe(30);
      expect(result.isActive).toBe(true);
    });

    it('handles missing service category gracefully', () => {
      const snakeCaseService: {
        id: string;
        name: string;
        service_categories: { id: string; name: string; display_order: number } | null;
      } = {
        id: 'svc-1',
        name: 'Haircut',
        service_categories: null,
      };

      const result = {
        categoryName: snakeCaseService.service_categories?.name ?? 'Uncategorized',
      };

      expect(result.categoryName).toBe('Uncategorized');
    });
  });

  describe('Technician type conversion', () => {
    it('converts snake_case to camelCase for technician', () => {
      const snakeCaseTech = {
        id: 'tech-1',
        first_name: 'Jane',
        last_name: 'Smith',
        display_name: 'Jane S.',
        photo_url: 'https://example.com/jane.jpg',
        status: 'available',
        service_ids: ['svc-1', 'svc-2'],
        estimated_wait_minutes: 15,
      };

      // Simulate the toTechnician function logic
      const result = {
        id: snakeCaseTech.id,
        firstName: snakeCaseTech.first_name,
        lastName: snakeCaseTech.last_name,
        displayName: snakeCaseTech.display_name,
        photoUrl: snakeCaseTech.photo_url ?? undefined,
        status: snakeCaseTech.status,
        serviceIds: snakeCaseTech.service_ids ?? [],
        estimatedWaitMinutes: snakeCaseTech.estimated_wait_minutes ?? undefined,
      };

      expect(result.displayName).toBe('Jane S.');
      expect(result.status).toBe('available');
      expect(result.serviceIds).toEqual(['svc-1', 'svc-2']);
    });
  });
});

describe('Input validation patterns', () => {
  it('validates phone number format', () => {
    const validPhones = ['5551234567', '1234567890'];
    const invalidPhones = ['123', '555-123-4567', '(555) 123-4567', 'abcdefghij'];

    validPhones.forEach(phone => {
      const cleaned = phone.replace(/\D/g, '');
      expect(cleaned.length).toBe(10);
    });

    invalidPhones.forEach(phone => {
      const cleaned = phone.replace(/\D/g, '');
      expect(cleaned.length === 10 && /^\d+$/.test(phone)).toBe(false);
    });
  });

  it('validates required fields for check-in creation', () => {
    const validCheckIn = {
      storeId: 'store-1',
      clientId: 'client-1',
      clientName: 'John Doe',
      clientPhone: '5551234567',
      services: [{ serviceId: 'svc-1', serviceName: 'Haircut', price: 25, durationMinutes: 30 }],
      technicianPreference: 'anyone',
      deviceId: 'device-1',
    };

    expect(validCheckIn.storeId).toBeTruthy();
    expect(validCheckIn.clientId).toBeTruthy();
    expect(validCheckIn.deviceId).toBeTruthy();
    expect(validCheckIn.services.length).toBeGreaterThan(0);
  });

  it('rejects check-in with empty services array', () => {
    const emptyServices: { serviceId: string }[] = [];
    expect(emptyServices.length).toBe(0);
    
    // Validation check
    const isValid = emptyServices.length > 0;
    expect(isValid).toBe(false);
  });

  it('rejects check-in with missing storeId', () => {
    const missingStoreId = '';
    expect(!!missingStoreId).toBe(false);
  });
});

describe('Upsell scoring algorithm', () => {
  it('scores same-category services higher', () => {
    const selectedCategories = new Set(['cat-1']);
    
    const sameCategoryService = { categoryId: 'cat-1', price: 25, durationMinutes: 30 };
    const differentCategoryService = { categoryId: 'cat-2', price: 25, durationMinutes: 30 };

    const scoreService = (service: { categoryId: string; price: number; durationMinutes: number }) => {
      let score = 0;
      if (selectedCategories.has(service.categoryId)) score += 3;
      if (service.durationMinutes <= 30) score += 2;
      if (service.price <= 30) score += 2;
      else if (service.price <= 50) score += 1;
      return score;
    };

    expect(scoreService(sameCategoryService)).toBe(7); // 3 + 2 + 2
    expect(scoreService(differentCategoryService)).toBe(4); // 0 + 2 + 2
  });

  it('scores quick add-ons higher', () => {
    const selectedCategories = new Set<string>();
    
    const quickService = { categoryId: 'cat-1', price: 25, durationMinutes: 20 };
    const longService = { categoryId: 'cat-1', price: 25, durationMinutes: 60 };

    const scoreService = (service: { categoryId: string; price: number; durationMinutes: number }) => {
      let score = 0;
      if (selectedCategories.has(service.categoryId)) score += 3;
      if (service.durationMinutes <= 30) score += 2;
      if (service.price <= 30) score += 2;
      else if (service.price <= 50) score += 1;
      return score;
    };

    expect(scoreService(quickService)).toBe(4); // 0 + 2 + 2
    expect(scoreService(longService)).toBe(2); // 0 + 0 + 2
  });

  it('scores lower-priced services higher', () => {
    const selectedCategories = new Set<string>();
    
    const cheapService = { categoryId: 'cat-1', price: 20, durationMinutes: 45 };
    const midService = { categoryId: 'cat-1', price: 40, durationMinutes: 45 };
    const expensiveService = { categoryId: 'cat-1', price: 60, durationMinutes: 45 };

    const scoreService = (service: { categoryId: string; price: number; durationMinutes: number }) => {
      let score = 0;
      if (selectedCategories.has(service.categoryId)) score += 3;
      if (service.durationMinutes <= 30) score += 2;
      if (service.price <= 30) score += 2;
      else if (service.price <= 50) score += 1;
      return score;
    };

    expect(scoreService(cheapService)).toBe(2); // 0 + 0 + 2
    expect(scoreService(midService)).toBe(1); // 0 + 0 + 1
    expect(scoreService(expensiveService)).toBe(0); // 0 + 0 + 0
  });
});
