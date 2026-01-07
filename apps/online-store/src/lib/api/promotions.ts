import { Promotion, PromotionValidation, AppliedDiscount, PromotionFilters } from '@/types/promotion';
import { Announcement } from '@/types/announcement';

// Mock promotions data - Replace with actual Mango API calls
const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'promo_001',
    title: 'New Client Welcome',
    description: 'Get 25% off your first service booking',
    type: 'new_client',
    value: 25,
    code: 'WELCOME25',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: true,
      showBanner: true,
      bannerStyle: 'top',
      priority: 1,
    },
    conditions: {
      firstTimeOnly: true,
      minPurchase: 50,
      applicableTypes: ['service'],
    },
    imageUrl: '/promotions/welcome.jpg',
    badgeText: 'NEW CLIENT',
  },
  {
    id: 'promo_002',
    title: 'Flash Sale - 48 Hours Only!',
    description: 'Save $20 on orders over $100',
    type: 'fixed',
    value: 20,
    code: 'FLASH20',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: true,
      showBanner: true,
      bannerStyle: 'top',
      priority: 2,
    },
    conditions: {
      minPurchase: 100,
      applicableTypes: ['product', 'service'],
    },
    badgeText: 'LIMITED TIME',
  },
  {
    id: 'promo_003',
    title: 'Buy One Get One Free',
    description: 'Buy any manicure service, get a pedicure free',
    type: 'bogo',
    value: 100,
    code: 'BOGO',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: false,
      showBanner: false,
      bannerStyle: 'inline',
      priority: 3,
    },
    conditions: {
      services: ['manicure', 'pedicure'],
      applicableTypes: ['service'],
    },
    badgeText: 'BOGO',
  },
  {
    id: 'promo_004',
    title: 'Free Shipping Weekend',
    description: 'Free shipping on all product orders',
    type: 'free_shipping',
    value: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: true,
      showBanner: true,
      bannerStyle: 'inline',
      priority: 4,
    },
    conditions: {
      applicableTypes: ['product'],
    },
    badgeText: 'FREE SHIPPING',
  },
  {
    id: 'promo_005',
    title: 'VIP Members Save 15%',
    description: 'Exclusive discount for VIP membership holders',
    type: 'percent',
    value: 15,
    code: 'VIP15',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: true,
      showBanner: false,
      bannerStyle: 'badge',
      priority: 5,
    },
    conditions: {
      minPurchase: 75,
      applicableTypes: ['product', 'service'],
    },
    badgeText: 'VIP ONLY',
  },
  {
    id: 'promo_006',
    title: 'Bundle & Save',
    description: 'Book 3+ services and save 20%',
    type: 'bundle',
    value: 20,
    code: 'BUNDLE20',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: false,
      showOnCart: true,
      showOnCheckout: false,
      showBanner: false,
      bannerStyle: 'inline',
      priority: 6,
    },
    conditions: {
      minPurchase: 150,
      applicableTypes: ['service'],
    },
    badgeText: 'BUNDLE DEAL',
  },
  {
    id: 'promo_007',
    title: 'Summer Sale',
    description: 'Save 30% on all hair services',
    type: 'percent',
    value: 30,
    code: 'SUMMER30',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: false,
      showOnCheckout: false,
      showBanner: true,
      bannerStyle: 'inline',
      priority: 7,
    },
    conditions: {
      services: ['haircut', 'hair-color', 'styling'],
      applicableTypes: ['service'],
    },
    badgeText: 'COMING SOON',
  },
  {
    id: 'promo_008',
    title: 'Student Discount',
    description: '10% off with valid student ID',
    type: 'percent',
    value: 10,
    code: 'STUDENT10',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: false,
      showOnCart: true,
      showOnCheckout: true,
      showBanner: false,
      bannerStyle: 'badge',
      priority: 8,
    },
    conditions: {
      minPurchase: 30,
      applicableTypes: ['product', 'service'],
    },
    badgeText: 'STUDENT',
  },
  {
    id: 'promo_009',
    title: 'Gift Card Bonus',
    description: 'Get a $25 bonus card with $100 gift card purchase',
    type: 'fixed',
    value: 25,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: false,
      showBanner: false,
      bannerStyle: 'inline',
      priority: 9,
    },
    conditions: {
      minPurchase: 100,
      applicableTypes: ['gift-card'],
    },
    badgeText: 'BONUS',
  },
  {
    id: 'promo_010',
    title: 'Refer a Friend',
    description: 'You and your friend both get $15 off',
    type: 'fixed',
    value: 15,
    code: 'REFER15',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    status: 'active',
    displayConfig: {
      showOnHomepage: true,
      showOnCart: true,
      showOnCheckout: true,
      showBanner: false,
      bannerStyle: 'badge',
      priority: 10,
    },
    conditions: {
      minPurchase: 50,
      applicableTypes: ['product', 'service'],
    },
    badgeText: 'REFERRAL',
  },
];

/**
 * Fetch active promotions with optional filters
 * Replace with actual Mango API endpoint: GET /api/promotions/active
 */
export async function getActivePromotions(filters?: PromotionFilters): Promise<Promotion[]> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    let promotions = MOCK_PROMOTIONS.filter((promo) => {
      const now = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      
      // Check if promotion is currently active
      if (now < startDate) {
        promo.status = 'scheduled';
      } else if (now > endDate) {
        promo.status = 'expired';
      } else {
        promo.status = 'active';
      }
      
      return true;
    });

    // Apply filters
    if (filters) {
      if (filters.status) {
        promotions = promotions.filter((p) => p.status === filters.status);
      }
      if (filters.type) {
        promotions = promotions.filter((p) => p.type === filters.type);
      }
      if (filters.showOnHomepage !== undefined) {
        promotions = promotions.filter((p) => p.displayConfig.showOnHomepage === filters.showOnHomepage);
      }
      if (filters.showBanner !== undefined) {
        promotions = promotions.filter((p) => p.displayConfig.showBanner === filters.showBanner);
      }
      if (filters.showOnCart !== undefined) {
        promotions = promotions.filter((p) => p.displayConfig.showOnCart === filters.showOnCart);
      }
    }

    // Sort by priority
    promotions.sort((a, b) => a.displayConfig.priority - b.displayConfig.priority);

    return promotions;
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return [];
  }
}

/**
 * Fetch a single promotion by ID
 * Replace with actual Mango API endpoint: GET /api/promotions/:id
 */
export async function getPromotionById(id: string): Promise<Promotion | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const promotion = MOCK_PROMOTIONS.find((p) => p.id === id);
  return promotion || null;
}

/**
 * Validate a promotion code against cart conditions
 * Replace with actual Mango API endpoint: POST /api/promotions/validate
 */
export async function validatePromotion(
  code: string,
  cartTotal: number,
  cartItems?: Array<{ type: string; id?: string }>,
  isFirstTime?: boolean
): Promise<PromotionValidation> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const promotion = MOCK_PROMOTIONS.find(
    (p) => p.code?.toLowerCase() === code.toLowerCase() && p.status === 'active'
  );

  if (!promotion) {
    return {
      valid: false,
      reason: 'Invalid or expired promotion code',
    };
  }

  // Check first-time customer condition
  if (promotion.conditions?.firstTimeOnly && !isFirstTime) {
    return {
      valid: false,
      reason: 'This promotion is only valid for first-time customers',
    };
  }

  // Check minimum purchase
  if (promotion.conditions?.minPurchase && cartTotal < promotion.conditions.minPurchase) {
    return {
      valid: false,
      reason: `Minimum purchase of $${promotion.conditions.minPurchase} required`,
    };
  }

  // Check applicable item types
  if (promotion.conditions?.applicableTypes && cartItems) {
    const hasApplicableItem = cartItems.some((item) =>
      promotion.conditions?.applicableTypes?.includes(item.type as any)
    );
    if (!hasApplicableItem) {
      return {
        valid: false,
        reason: 'No eligible items in cart for this promotion',
      };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (promotion.type === 'percent') {
    discountAmount = (cartTotal * promotion.value) / 100;
    if (promotion.conditions?.maxDiscount) {
      discountAmount = Math.min(discountAmount, promotion.conditions.maxDiscount);
    }
  } else if (promotion.type === 'fixed') {
    discountAmount = promotion.value;
  } else if (promotion.type === 'free_shipping') {
    discountAmount = 0; // Handled separately in shipping calculation
  }

  return {
    valid: true,
    discount: {
      amount: discountAmount,
      type: promotion.type === 'percent' ? 'percent' : 'fixed',
      value: promotion.value,
    },
    promotion,
  };
}

/**
 * Apply a promotion to the cart
 * Replace with actual Mango API endpoint: POST /api/promotions/apply
 */
export async function applyPromotion(
  code: string,
  cartId: string,
  cartTotal: number
): Promise<AppliedDiscount> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const validation = await validatePromotion(code, cartTotal);

  if (!validation.valid || !validation.discount || !validation.promotion) {
    throw new Error(validation.reason || 'Failed to apply promotion');
  }

  return {
    promotionId: validation.promotion.id,
    code: code.toUpperCase(),
    amount: validation.discount.amount,
    type: validation.promotion.type,
    appliedAt: new Date().toISOString(),
  };
}

/**
 * Get suggested promotions based on cart contents
 */
export async function getSuggestedPromotions(
  cartTotal: number,
  cartItems?: Array<{ type: string; id?: string }>
): Promise<Promotion[]> {
  const allPromotions = await getActivePromotions({ status: 'active', showOnCart: true });

  // Filter promotions that user might be close to qualifying for
  return allPromotions.filter((promo) => {
    if (!promo.conditions?.minPurchase) return true;
    
    // Show promotions user is within $20 of qualifying for
    const shortfall = promo.conditions.minPurchase - cartTotal;
    return shortfall > 0 && shortfall <= 20;
  });
}

// ==================== ANNOUNCEMENTS ====================

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    title: 'Holiday Hours: Closed December 25-26',
    content: 'Our salon will be closed on December 25th and 26th for the holidays. We will resume normal hours on December 27th. Thank you for understanding!',
    category: 'hours',
    priority: 'urgent',
    status: 'active',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ann_002',
    title: 'New Service: Keratin Hair Treatment Now Available',
    content: 'We are excited to announce our new keratin hair treatment service! Book your appointment today and get smooth, frizz-free hair that lasts for months.',
    category: 'services',
    priority: 'important',
    status: 'active',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ann_003',
    title: 'Meet Our New Stylist: Sarah Chen',
    content: 'Please welcome Sarah Chen to our team! Sarah specializes in color treatments and has over 10 years of experience. Book with Sarah and receive 15% off your first appointment.',
    category: 'staff',
    priority: 'normal',
    status: 'active',
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ann_004',
    title: 'Updated Cancellation Policy',
    content: 'Please note: Starting next month, we require 24 hours notice for cancellations. Late cancellations or no-shows may be subject to a fee. Thank you for your cooperation.',
    category: 'policies',
    priority: 'important',
    status: 'active',
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ann_005',
    title: 'Spring Beauty Event - March 15th',
    content: 'Join us for our annual Spring Beauty Event on March 15th! Enjoy mini makeovers, product demos, refreshments, and exclusive event-day discounts. RSVP required.',
    category: 'events',
    priority: 'normal',
    status: 'active',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ann_006',
    title: 'Parking Update: New Lot Available',
    content: 'Good news! Additional parking is now available in the lot behind our building. Look for the "Mango Salon Guest Parking" signs.',
    category: 'hours',
    priority: 'info',
    status: 'active',
    startsAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Fetch active announcements
 * Replace with actual Mango API endpoint: GET /api/v1/store/announcements?status=active
 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const now = new Date();
    
    return MOCK_ANNOUNCEMENTS.filter((announcement) => {
      const startsAt = new Date(announcement.startsAt);
      const endsAt = announcement.endsAt ? new Date(announcement.endsAt) : null;
      
      // Check if announcement is currently active based on time
      const isStarted = now >= startsAt;
      const hasNotEnded = !endsAt || now <= endsAt;
      
      return announcement.status === 'active' && isStarted && hasNotEnded;
    }).sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { urgent: 0, important: 1, normal: 2, info: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}

/**
 * Get announcements by category
 */
export async function getAnnouncementsByCategory(category: string): Promise<Announcement[]> {
  const announcements = await getActiveAnnouncements();
  return announcements.filter((a) => a.category === category);
}
