import { z } from 'zod';

// Base types
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0),
  hasMore: z.boolean(),
});

// Tenant configuration
export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }),
  hours: z.array(z.object({
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
    isClosed: z.boolean().default(false),
  })),
  socialMedia: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    tiktok: z.string().url().optional(),
  }).optional(),
});

// Service schemas
export const ServiceSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['hair', 'nails', 'spa', 'makeup', 'brows', 'lashes']),
  duration: z.number().int().min(15).max(480), // minutes
  price: z.number().positive(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().default(true),
  isBookableOnline: z.boolean().default(true),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  staff: z.array(z.string().uuid()).optional(), // staff public IDs
});

export const ServicesResponseSchema = z.object({
  data: z.array(ServiceSchema),
  pagination: PaginationSchema,
});

// Product schemas
export const ProductSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.enum(['hair', 'nails', 'spa', 'makeup', 'tools', 'accessories']),
  brand: z.string().optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'pre_order']).default('in_stock'),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  weight: z.number().positive().optional(), // grams
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

export const ProductsResponseSchema = z.object({
  data: z.array(ProductSchema),
  pagination: PaginationSchema,
});

// Membership schemas
export const MembershipTierSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  duration: z.number().int().positive(), // months
  benefits: z.array(z.string()),
  discountPercentage: z.number().min(0).max(100).optional(),
  maxBookings: z.number().int().positive().optional(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const MembershipsResponseSchema = z.object({
  data: z.array(MembershipTierSchema),
});

// Gift card schemas
export const GiftCardSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  amount: z.number().positive(),
  isCustomAmount: z.boolean().default(false),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const GiftCardsResponseSchema = z.object({
  data: z.array(GiftCardSchema),
});

// Team schemas
export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  name: z.string().min(1),
  title: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  specialties: z.array(z.string()),
  services: z.array(z.string().uuid()), // service public IDs
  isBookableOnline: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  experience: z.number().int().min(0).optional(), // years
  certifications: z.array(z.string()).optional(),
  socialMedia: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
  }).optional(),
});

export const TeamResponseSchema = z.object({
  data: z.array(TeamMemberSchema),
});

// Review schemas
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  clientName: z.string().min(1),
  serviceName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  date: z.string().datetime(),
  isVerified: z.boolean().default(false),
  images: z.array(z.string().url()).optional(),
  response: z.object({
    text: z.string(),
    date: z.string().datetime(),
    author: z.string(),
  }).optional(),
});

export const ReviewsResponseSchema = z.object({
  data: z.array(ReviewSchema),
  pagination: PaginationSchema,
  aggregate: z.object({
    count: z.number().int().min(0),
    average: z.number().min(0).max(5),
    distribution: z.object({
      five: z.number().int().min(0),
      four: z.number().int().min(0),
      three: z.number().int().min(0),
      two: z.number().int().min(0),
      one: z.number().int().min(0),
    }),
  }),
});

// Gallery schemas
export const GalleryItemSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url(),
  category: z.enum(['hair', 'nails', 'spa', 'makeup', 'before_after', 'team']),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

export const GalleryResponseSchema = z.object({
  data: z.array(GalleryItemSchema),
  pagination: PaginationSchema,
});

// Promotion schemas
export const PromotionSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'bogo']),
  value: z.number().positive(),
  minPurchaseAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  applicableServices: z.array(z.string().uuid()).optional(),
  applicableProducts: z.array(z.string().uuid()).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  displaySettings: z.object({
    showInHero: z.boolean().default(false),
    showInBanner: z.boolean().default(false),
    showInModal: z.boolean().default(false),
    countdown: z.boolean().default(false),
    priority: z.number().int().min(0).max(10).default(5),
  }),
});

export const PromotionsResponseSchema = z.object({
  data: z.array(PromotionSchema),
});

// Announcement schemas
export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  publicId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['urgent', 'important', 'normal', 'info']),
  priority: z.number().int().min(0).max(10).default(5),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  displaySettings: z.object({
    showInHero: z.boolean().default(false),
    showInBanner: z.boolean().default(true),
    showInModal: z.boolean().default(false),
    dismissible: z.boolean().default(true),
  }),
  targetAudience: z.enum(['all', 'new_clients', 'existing_clients', 'members']).default('all'),
});

export const AnnouncementsResponseSchema = z.object({
  data: z.array(AnnouncementSchema),
});

// Booking schemas
export const AvailabilitySlotSchema = z.object({
  id: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  staffId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  isAvailable: z.boolean().default(true),
  capacity: z.number().int().min(1).default(1),
  bookedCount: z.number().int().min(0).default(0),
});

export const AvailabilityResponseSchema = z.object({
  data: z.array(AvailabilitySlotSchema),
  date: z.string().date(),
  locationId: z.string().uuid(),
});

export const BookingDraftSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  slotId: z.string().uuid(),
  clientInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  notes: z.string().optional(),
  totalPrice: z.number().positive(),
  expiresAt: z.string().datetime(),
});

export const BookingConfirmationSchema = z.object({
  id: z.string().uuid(),
  confirmationNumber: z.string(),
  status: z.enum(['confirmed', 'pending', 'cancelled']),
  booking: BookingDraftSchema,
  createdAt: z.string().datetime(),
});

// Cart schemas
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['service', 'product', 'membership', 'gift_card']),
  itemId: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(1),
  total: z.number().positive(),
  metadata: z.record(z.any()).optional(),
});

export const CartSessionSchema = z.object({
  id: z.string().uuid(),
  items: z.array(CartItemSchema),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CartResponseSchema = z.object({
  data: CartSessionSchema,
});

// Order schemas
export const OrderLineItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['service', 'product', 'membership', 'gift_card']),
  itemId: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(1),
  total: z.number().positive(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'refunded']),
  items: z.array(OrderLineItemSchema),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  clientInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  paymentInfo: z.object({
    method: z.string(),
    status: z.enum(['pending', 'completed', 'failed', 'refunded']),
    transactionId: z.string().optional(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OrderResponseSchema = z.object({
  data: OrderSchema,
});

// AI schemas
export const AIQuerySchema = z.object({
  query: z.string().min(1),
  context: z.string().optional(),
  type: z.enum(['chat', 'recommendation', 'copywriting']).default('chat'),
});

export const AIResponseSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// Error schemas
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

// Type exports
export type Tenant = z.infer<typeof TenantSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type ServicesResponse = z.infer<typeof ServicesResponseSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
export type MembershipTier = z.infer<typeof MembershipTierSchema>;
export type MembershipsResponse = z.infer<typeof MembershipsResponseSchema>;
export type GiftCard = z.infer<typeof GiftCardSchema>;
export type GiftCardsResponse = z.infer<typeof GiftCardsResponseSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type TeamResponse = z.infer<typeof TeamResponseSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ReviewsResponse = z.infer<typeof ReviewsResponseSchema>;
export type GalleryItem = z.infer<typeof GalleryItemSchema>;
export type GalleryResponse = z.infer<typeof GalleryResponseSchema>;
export type Promotion = z.infer<typeof PromotionSchema>;
export type PromotionsResponse = z.infer<typeof PromotionsResponseSchema>;
export type Announcement = z.infer<typeof AnnouncementSchema>;
export type AnnouncementsResponse = z.infer<typeof AnnouncementsResponseSchema>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type BookingDraft = z.infer<typeof BookingDraftSchema>;
export type BookingConfirmation = z.infer<typeof BookingConfirmationSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type CartSession = z.infer<typeof CartSessionSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type AIQuery = z.infer<typeof AIQuerySchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;




