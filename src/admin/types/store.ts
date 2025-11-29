/**
 * Store Types
 * A store is a POS location with login credentials
 */

export type StoreStatus = 'active' | 'inactive' | 'suspended';

export interface Store {
  id: string;
  licenseId: string;
  tenantId: string;             // Denormalized for easier queries

  // Store Info
  name: string;
  address?: string;
  phone?: string;
  timezone?: string;

  // Login Credentials
  storeLoginId: string;         // Email or auto-generated ID for login
  passwordHash: string;         // Hashed password

  // Status
  status: StoreStatus;
  activatedAt?: Date;           // When the store was first activated
  lastLoginAt?: Date;           // Last successful login
  lastSeenAt?: Date;            // Last time store checked in
  deviceCount: number;          // Current number of registered devices

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoreInput {
  licenseId: string;
  tenantId: string;
  name: string;
  storeEmail?: string;          // Optional - if not provided, ID is auto-generated
  password: string;             // Will be hashed
  address?: string;
  phone?: string;
  timezone?: string;
}

export interface UpdateStoreInput {
  name?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  status?: StoreStatus;
  password?: string;            // To change password
}

/**
 * Generate a store login ID
 * If email provided, use that. Otherwise generate a unique ID.
 */
export function generateStoreLoginId(email?: string): string {
  if (email) {
    return email.toLowerCase().trim();
  }
  // Generate random ID: store-XXXXXXXX
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'store-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
