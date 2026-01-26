/**
 * Membership Storage - localStorage CRUD for membership plans
 * @deprecated Use catalogSyncService instead. This file is kept only for backward compatibility.
 */

import type { MembershipPlan } from '@/types/catalog';
export type { MembershipPlan };

const STORAGE_KEY = 'mango-membership-plans';

/**
 * Initialize membership plans with default data
 */
export function initializeMembershipPlans(): void {
  const plans = localStorage.getItem(STORAGE_KEY);
  if (!plans) {
    const defaultPlans: MembershipPlan[] = [
      {
        id: 'basic-plan',
        name: 'basic',
        displayName: 'Basic',
        priceMonthly: 49,
        description: 'Perfect for regular self-care',
        tagline: 'Start Your Beauty Journey',
        imageUrl: '/assets/memberships/basic-hero.jpg',
        badgeIcon: 'Sparkles',
        color: 'hsl(280, 65%, 60%)',
        perks: ['10% off all services', '1 complimentary nail service per month', 'Priority booking'],
        features: {
          discountPercentage: 10,
          complimentaryServices: 1,
          priorityBooking: true,
        },
        rules: {
          minCommitmentMonths: 1,
          cancellationNoticeDays: 30,
        },
        isPopular: false,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'premium-plan',
        name: 'premium',
        displayName: 'Premium',
        priceMonthly: 99,
        description: 'Elevated beauty experience',
        tagline: 'Unlock Premium Benefits',
        imageUrl: '/assets/memberships/premium-hero.jpg',
        badgeIcon: 'Crown',
        color: 'hsl(340, 75%, 55%)',
        perks: ['20% off all services', '2 complimentary services per month', 'Free product samples', 'VIP lounge access'],
        features: {
          discountPercentage: 20,
          complimentaryServices: 2,
          freeProductSamples: true,
          vipLoungeAccess: true,
        },
        rules: {
          minCommitmentMonths: 3,
          cancellationNoticeDays: 30,
        },
        isPopular: true,
        isActive: true,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'vip-plan',
        name: 'vip',
        displayName: 'VIP',
        priceMonthly: 199,
        description: 'Ultimate luxury treatment',
        tagline: 'Experience True VIP Treatment',
        imageUrl: '/assets/memberships/vip-hero.jpg',
        badgeIcon: 'Star',
        color: 'hsl(45, 90%, 60%)',
        perks: ['30% off all services', 'Unlimited complimentary services', 'Exclusive events & workshops', 'Personal beauty concierge'],
        features: {
          discountPercentage: 30,
          unlimitedServices: true,
          exclusiveEvents: true,
          personalConcierge: true,
        },
        rules: {
          minCommitmentMonths: 6,
          cancellationNoticeDays: 60,
        },
        isPopular: false,
        isActive: true,
        sortOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPlans));
  }
}

/**
 * Get all membership plans
 */
export function getMembershipPlans(): MembershipPlan[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get active membership plans only
 */
export function getActiveMembershipPlans(): MembershipPlan[] {
  return getMembershipPlans()
    .filter(p => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get membership plan by ID
 */
export function getMembershipPlanById(id: string): MembershipPlan | null {
  const plans = getMembershipPlans();
  return plans.find(p => p.id === id) || null;
}

/**
 * Create membership plan
 */
export function createMembershipPlan(data: Omit<MembershipPlan, 'createdAt' | 'updatedAt'>): MembershipPlan {
  const plans = getMembershipPlans();
  const newPlan: MembershipPlan = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  plans.push(newPlan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return newPlan;
}

/**
 * Update membership plan
 */
export function updateMembershipPlan(id: string, data: Partial<MembershipPlan>): MembershipPlan | null {
  const plans = getMembershipPlans();
  const index = plans.findIndex(p => p.id === id);
  
  if (index === -1) return null;

  plans[index] = {
    ...plans[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return plans[index];
}

/**
 * Delete membership plan
 */
export function deleteMembershipPlan(id: string): boolean {
  const plans = getMembershipPlans();
  const filtered = plans.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
