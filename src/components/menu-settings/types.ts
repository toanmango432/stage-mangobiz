// Menu Settings Types - Comprehensive types for salon/spa service menu management

export type PricingType = 'fixed' | 'from' | 'free' | 'varies' | 'hourly';
export type ServiceStatus = 'active' | 'inactive' | 'archived';
export type BookingAvailability = 'online' | 'in-store' | 'both' | 'disabled';

// Service Category
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  servicesCount?: number;
  parentCategoryId?: string; // For sub-categories
  createdAt: Date;
  updatedAt: Date;
}

// Service Variant (different pricing/duration options)
export interface ServiceVariant {
  id: string;
  name: string; // e.g., "Short Hair", "Medium Hair", "Long Hair"
  duration: number; // minutes
  price: number;
  processingTime?: number; // buffer time in minutes
  isDefault?: boolean;
}

// Service
export interface MenuService {
  id: string;
  categoryId: string;
  name: string;
  description?: string;

  // Pricing
  pricingType: PricingType;
  price: number; // Base price or starting price
  priceMax?: number; // For 'varies' pricing type

  // Duration
  duration: number; // minutes
  processingTime?: number; // Additional buffer time

  // Variants
  hasVariants: boolean;
  variants: ServiceVariant[];

  // Staff & Availability
  assignedStaffIds: string[]; // Empty means all staff
  allStaffCanPerform: boolean;
  bookingAvailability: BookingAvailability;

  // Online Booking Settings
  onlineBookingEnabled: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  depositPercentage?: number;

  // Additional Settings
  taxable: boolean;
  commissionRate?: number; // percentage
  color?: string; // Override category color
  images?: string[];
  tags?: string[];

  // Visibility & Status
  status: ServiceStatus;
  displayOrder: number;
  showPriceOnline: boolean;
  allowCustomDuration: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Service Package/Bundle
export interface ServicePackage {
  id: string;
  name: string;
  description?: string;

  // Services included
  services: PackageService[];

  // Pricing
  originalPrice: number; // Sum of individual services
  packagePrice: number; // Discounted price
  discountType: 'fixed' | 'percentage';
  discountValue: number;

  // Validity
  validityDays?: number; // How long the package is valid after purchase
  usageLimit?: number; // How many times can be used

  // Booking
  bookingAvailability: BookingAvailability;
  onlineBookingEnabled: boolean;

  // Status
  isActive: boolean;
  displayOrder: number;

  // Metadata
  color?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageService {
  serviceId: string;
  serviceName: string;
  quantity: number;
  originalPrice: number;
}

// Service Add-on
export interface ServiceAddOn {
  id: string;
  name: string;
  description?: string;

  // Pricing & Duration
  price: number;
  duration: number; // minutes

  // Applicability
  applicableToAll: boolean;
  applicableCategoryIds: string[];
  applicableServiceIds: string[];

  // Settings
  isActive: boolean;
  displayOrder: number;
  onlineBookingEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Staff Service Permission
export interface StaffServicePermission {
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  serviceIds: string[];
  categoryIds: string[]; // Can perform all services in category
  canPerformAllServices: boolean;
  customPricing?: StaffCustomPricing[];
  customDuration?: StaffCustomDuration[];
}

export interface StaffCustomPricing {
  serviceId: string;
  price: number;
}

export interface StaffCustomDuration {
  serviceId: string;
  duration: number;
}

// Menu Settings State
export interface MenuSettingsState {
  categories: ServiceCategory[];
  services: MenuService[];
  packages: ServicePackage[];
  addOns: ServiceAddOn[];
  staffPermissions: StaffServicePermission[];

  // General Settings
  settings: MenuGeneralSettings;
}

export interface MenuGeneralSettings {
  defaultDuration: number; // Default service duration in minutes
  defaultProcessingTime: number;
  showPricesOnline: boolean;
  requireDepositForOnlineBooking: boolean;
  defaultDepositPercentage: number;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  allowCustomPricing: boolean;
  enablePackages: boolean;
  enableAddOns: boolean;
}

// UI State Types
export type MenuSettingsTab = 'categories' | 'services' | 'packages' | 'addons' | 'staff' | 'settings';
export type ViewMode = 'grid' | 'list' | 'compact';

export interface MenuSettingsUIState {
  activeTab: MenuSettingsTab;
  selectedCategoryId: string | null;
  searchQuery: string;
  viewMode: ViewMode;
  showInactive: boolean;
  expandedCategories: string[];
}

// Modal Props Types
export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: ServiceCategory;
  onSave: (category: Partial<ServiceCategory>) => void;
}

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: MenuService;
  categories: ServiceCategory[];
  onSave: (service: Partial<MenuService>) => void;
}

export interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: ServicePackage;
  services: MenuService[];
  onSave: (pkg: Partial<ServicePackage>) => void;
}

export interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  addOn?: ServiceAddOn;
  categories: ServiceCategory[];
  services: MenuService[];
  onSave: (addOn: Partial<ServiceAddOn>) => void;
}
