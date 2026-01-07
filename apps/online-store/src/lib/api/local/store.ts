// Local Store API Implementation
// Replaces supabase/functions/store/index.ts with local mock

import { LOCAL_API_CONFIG } from './config';
import type { StoreApiResponse } from './types';

// Simulate network delay
async function simulateDelay(): Promise<void> {
  if (LOCAL_API_CONFIG.MOCK_DATA.ENABLE_DELAYS) {
    await new Promise(resolve => setTimeout(resolve, LOCAL_API_CONFIG.MOCK_DATA.DEFAULT_DELAY));
  }
}

// Mock data (same as Supabase function)
const salonInfo = {
  name: 'Mango Nail & Beauty Salon',
  tagline: 'Your destination for beauty and relaxation',
  description: 'Experience luxury beauty services in a relaxing atmosphere. Our expert team provides personalized nail care, hair styling, skincare treatments, and more. We use only premium products and the latest techniques to ensure you look and feel your best.',
  address: {
    street: '123 Beauty Lane',
    city: 'Style City',
    state: 'SC',
    zip: '12345',
    country: 'USA'
  },
  contact: {
    phone: '(555) 123-4567',
    email: 'hello@mangosalon.com'
  },
  hours: {
    monday: '9:00 AM - 7:00 PM',
    tuesday: '9:00 AM - 7:00 PM',
    wednesday: '9:00 AM - 7:00 PM',
    thursday: '9:00 AM - 7:00 PM',
    friday: '9:00 AM - 7:00 PM',
    saturday: '9:00 AM - 7:00 PM',
    sunday: '10:00 AM - 6:00 PM'
  },
  social: {
    instagram: 'https://instagram.com/mangosalon',
    facebook: 'https://facebook.com/mangosalon',
    twitter: 'https://twitter.com/mangosalon'
  },
  coordinates: {
    lat: 40.7128,
    lng: -74.0060
  }
};

const reviews = [
  {
    id: 'r1',
    clientName: 'Sarah Johnson',
    rating: 5,
    dateISO: '2025-10-15',
    serviceName: 'Gel Manicure',
    serviceId: 'gel-manicure',
    comment: 'Absolutely love my nails! The attention to detail is incredible. The salon is clean, relaxing, and the staff are so friendly.',
    staffId: 'staff1',
    staffName: 'Sarah Chen',
    verified: true
  },
  {
    id: 'r2',
    clientName: 'Michael Chen',
    rating: 5,
    dateISO: '2025-10-14',
    serviceName: 'Haircut & Style',
    serviceId: 'haircut-style',
    comment: 'Best haircut I\'ve had in years. They really listened to what I wanted and delivered perfectly. Highly recommend!',
    staffId: 'staff2',
    staffName: 'Jessica Lee',
    verified: true
  },
  {
    id: 'r3',
    clientName: 'Emily Rodriguez',
    rating: 5,
    dateISO: '2025-10-12',
    serviceName: 'Facial Treatment',
    serviceId: 'facial',
    comment: 'My skin has never looked better! The facial was relaxing and effective. Will definitely be back monthly.',
    staffId: 'staff3',
    staffName: 'Emily Rodriguez',
    verified: true
  },
  {
    id: 'r4',
    clientName: 'David Park',
    rating: 4,
    dateISO: '2025-10-10',
    serviceName: 'Pedicure',
    serviceId: 'pedicure',
    comment: 'Great experience overall. Very professional service and clean facility. Slight wait time but worth it.',
    staffId: 'staff1',
    staffName: 'Sarah Chen',
    verified: true
  },
  {
    id: 'r5',
    clientName: 'Jessica Williams',
    rating: 5,
    dateISO: '2025-10-08',
    serviceName: 'Bridal Package',
    serviceId: 'bridal-package',
    comment: 'Made me feel like a princess on my wedding day! The team was amazing and everything was perfect. Thank you!',
    staffId: 'staff2',
    staffName: 'Jessica Lee',
    verified: true
  }
];

const gallery = [
  {
    id: 'g1',
    url: '/src/assets/work-balayage.jpg',
    caption: 'Beautiful balayage color transformation',
    tags: ['hair', 'color', 'balayage'],
    date: '2025-10-01'
  },
  {
    id: 'g2',
    url: '/src/assets/work-crystal-nails.jpg',
    caption: 'Elegant crystal nail art',
    tags: ['nails', 'nail-art', 'crystals'],
    date: '2025-09-28'
  },
  {
    id: 'g3',
    url: '/src/assets/work-bridal-makeup.jpg',
    caption: 'Stunning bridal makeup',
    tags: ['makeup', 'bridal'],
    date: '2025-09-25'
  }
];

const teamMembers = [
  {
    id: 'tm_sarah_chen',
    name: 'Sarah Chen',
    role: 'Master Stylist & Colorist',
    avatarUrl: '/src/assets/team-sarah-chen.jpg',
    specialties: ['Balayage', 'Color Correction', 'Extensions'],
    rating: 4.9,
    bioShort: 'Award-winning stylist with 10+ years of experience',
    bio: 'Sarah specializes in color transformations and has trained under top colorists in NYC.',
    experience: '10+ years'
  },
  {
    id: 'tm_jessica_lee',
    name: 'Jessica Lee',
    role: 'Senior Nail Technician',
    avatarUrl: '/src/assets/team-jessica-lee.jpg',
    specialties: ['Gel Extensions', 'Nail Art', 'Acrylic'],
    rating: 4.8,
    bioShort: 'Specialized in intricate nail art and gel extensions',
    bio: 'Jessica creates stunning nail designs and is passionate about nail health.',
    experience: '8 years'
  },
  {
    id: 'tm_emily_rodriguez',
    name: 'Emily Rodriguez',
    role: 'Esthetician & Makeup Artist',
    avatarUrl: '/src/assets/team-emily-rodriguez.jpg',
    specialties: ['Facials', 'Chemical Peels', 'Bridal Makeup'],
    rating: 5.0,
    bioShort: 'Expert in skincare treatments and special occasion makeup',
    bio: 'Emily is certified in advanced skincare techniques and has a passion for making clients feel beautiful.',
    experience: '7 years'
  }
];

// Marketing display settings (in-memory storage)
let marketingDisplaySettings = {
  enablePromotions: true,
  enableAnnouncements: true,
  defaults: {
    promotions: {
      homeBannerEnabled: true,
      homeStripEnabled: true,
      cartHintEnabled: false
    },
    announcements: {
      globalBarEnabled: true,
      homeBannerEnabled: false
    }
  },
  promotions: [],
  announcements: []
};

// API Functions

export async function getSalonInfo(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  return {
    success: true,
    data: { info: salonInfo }
  };
}

export async function getReviews(params: {
  limit?: number;
  offset?: number;
  serviceId?: string;
  staffId?: string;
  minRating?: number;
} = {}): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const { limit = 10, offset = 0, serviceId, staffId, minRating } = params;
  
  // Apply filters
  let filtered = [...reviews];
  
  if (serviceId) {
    filtered = filtered.filter(r => r.serviceId === serviceId);
  }
  
  if (staffId) {
    filtered = filtered.filter(r => r.staffId === staffId);
  }
  
  if (minRating) {
    filtered = filtered.filter(r => r.rating >= minRating);
  }
  
  // Apply pagination
  const paginated = filtered.slice(offset, offset + limit);
  
  // Calculate aggregate
  const count = filtered.length;
  const avg = count > 0 
    ? filtered.reduce((sum, r) => sum + r.rating, 0) / count 
    : 0;
  
  // Calculate next offset
  const nextOffset = offset + limit < filtered.length 
    ? offset + limit 
    : undefined;
  
  return {
    success: true,
    data: {
      reviews: paginated,
      aggregate: { count, avg },
      nextOffset
    }
  };
}

export async function getReviewServices(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const services = Array.from(new Set(reviews.map(r => ({ id: r.serviceId, name: r.serviceName }))))
    .filter(s => s.id);
  
  return {
    success: true,
    data: { services }
  };
}

export async function getReviewStaff(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const staff = Array.from(new Set(reviews.map(r => ({ id: r.staffId, name: r.staffName }))))
    .filter(s => s.id);
  
  return {
    success: true,
    data: { staff }
  };
}

export async function getGallery(params: {
  limit?: number;
  offset?: number;
  tags?: string[];
} = {}): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const { limit = 12, offset = 0, tags } = params;
  
  let filtered = [...gallery];
  
  if (tags && tags.length > 0) {
    filtered = filtered.filter(item => 
      tags.some(tag => item.tags.includes(tag))
    );
  }
  
  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    success: true,
    data: {
      items: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    }
  };
}

export async function getTeamMembers(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  return {
    success: true,
    data: { team: teamMembers }
  };
}

export async function getTeamMember(id: string): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const member = teamMembers.find(m => m.id === id);
  
  if (!member) {
    return {
      success: false,
      error: 'Team member not found'
    };
  }
  
  return {
    success: true,
    data: { member }
  };
}

// Marketing Settings API
export async function getMarketingSettings(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  return {
    success: true,
    data: { settings: marketingDisplaySettings }
  };
}

export async function updateMarketingSettings(updates: any): Promise<StoreApiResponse> {
  await simulateDelay();
  
  marketingDisplaySettings = {
    ...marketingDisplaySettings,
    ...updates,
    defaults: {
      ...marketingDisplaySettings.defaults,
      ...updates.defaults
    }
  };
  
  return {
    success: true,
    data: { settings: marketingDisplaySettings }
  };
}

export async function updatePromotionPlacement(
  promotionId: string, 
  update: { placement: string; rank?: number; limitCountdown?: boolean }
): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const validPlacements = ['hidden', 'home_banner', 'home_strip', 'promotions_page_only', 'cart_hint'];
  if (!validPlacements.includes(update.placement)) {
    return {
      success: false,
      error: 'Invalid placement. Must be one of: ' + validPlacements.join(', ')
    };
  }
  
  const existingIndex = marketingDisplaySettings.promotions.findIndex(p => p.id === promotionId);
  
  const config = {
    id: promotionId,
    placement: update.placement,
    rank: update.rank !== undefined ? update.rank : 0,
    limitCountdown: update.limitCountdown !== undefined ? update.limitCountdown : true
  };
  
  if (existingIndex >= 0) {
    marketingDisplaySettings.promotions[existingIndex] = config;
  } else {
    marketingDisplaySettings.promotions.push(config);
  }
  
  return {
    success: true,
    data: { settings: marketingDisplaySettings }
  };
}

export async function updateAnnouncementPlacement(
  announcementId: string,
  update: { placement: string; pinned?: boolean }
): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const validPlacements = ['hidden', 'global_bar', 'home_banner', 'updates_page_only'];
  if (!validPlacements.includes(update.placement)) {
    return {
      success: false,
      error: 'Invalid placement. Must be one of: ' + validPlacements.join(', ')
    };
  }
  
  const existingIndex = marketingDisplaySettings.announcements.findIndex(a => a.id === announcementId);
  
  const config = {
    id: announcementId,
    placement: update.placement,
    pinned: update.pinned !== undefined ? update.pinned : false
  };
  
  if (existingIndex >= 0) {
    marketingDisplaySettings.announcements[existingIndex] = config;
  } else {
    marketingDisplaySettings.announcements.push(config);
  }
  
  return {
    success: true,
    data: { settings: marketingDisplaySettings }
  };
}

// Apply promotion to cart
export async function applyPromotionToCart(
  sessionId: string, 
  promotionId: string
): Promise<StoreApiResponse> {
  await simulateDelay();
  
  // Mock cart update
  const mockCart = {
    id: `cart_${sessionId}`,
    sessionId,
    items: [],
    promo: {
      promotionId,
      appliedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
  
  return {
    success: true,
    data: { cart: mockCart }
  };
}

// FAQ endpoint
export async function getFAQ(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const faqs = [
    {
      id: 'faq1',
      question: 'What are your hours?',
      answer: 'We are open Monday-Saturday 9:00 AM - 7:00 PM and Sunday 10:00 AM - 6:00 PM.'
    },
    {
      id: 'faq2',
      question: 'Do I need to book an appointment?',
      answer: 'Yes, we recommend booking appointments in advance to ensure availability. You can book online or call us directly.'
    },
    {
      id: 'faq3',
      question: 'What is your cancellation policy?',
      answer: 'We require 24-hour notice for cancellations to avoid charges. Same-day cancellations may incur a fee.'
    }
  ];
  
  return {
    success: true,
    data: { faqs }
  };
}

// Policies endpoint
export async function getPolicies(): Promise<StoreApiResponse> {
  await simulateDelay();
  
  const policies = {
    cancellation: '24-hour cancellation notice required for full refund',
    lateness: 'Please arrive 10 minutes early. Late arrivals may need to reschedule',
    payment: 'We accept all major credit cards, cash, and gift cards',
    refunds: 'Refunds are processed within 5-7 business days',
    privacy: 'We respect your privacy and never share your information with third parties'
  };
  
  return {
    success: true,
    data: { policies }
  };
}
