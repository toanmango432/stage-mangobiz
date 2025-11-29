/**
 * Tenant Types
 * A tenant is a customer/business that purchases licenses for their POS stores
 */

export type TenantStatus = 'active' | 'suspended' | 'inactive';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: TenantStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}

export interface UpdateTenantInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status?: TenantStatus;
  notes?: string;
}
