/**
 * Supabase Database Types
 * Matches the schema created in Supabase
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Existing Control Center tables
      stores: {
        Row: {
          id: string;
          license_id: string;
          tenant_id: string;
          name: string;
          store_login_id: string;
          password_hash: string;
          store_email: string | null;
          address: string | null;
          phone: string | null;
          timezone: string | null;
          status: string;
          settings: Json | null;
          device_policy: Json | null;
          last_login_at: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stores']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stores']['Insert']>;
      };

      devices: {
        Row: {
          id: string;
          store_id: string;
          license_id: string;
          tenant_id: string;
          device_name: string | null;
          device_fingerprint: string;
          device_type: string;
          browser: string | null;
          os: string | null;
          user_agent: string | null;
          status: string;
          offline_mode_enabled: boolean;
          is_revoked: boolean;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          registered_by: string | null;
          last_seen_at: string | null;
          last_login_at: string | null;
          last_sync_at: string | null;
          registered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'created_at' | 'updated_at' | 'registered_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          registered_at?: string;
        };
        Update: Partial<Database['public']['Tables']['devices']['Insert']>;
      };

      // Team Members (for authentication and permissions)
      // Note: Actual table uses 'name' (not first_name/last_name) and 'status' (not is_active)
      members: {
        Row: {
          id: string;
          tenant_id: string | null;
          email: string;
          password_hash: string;
          pin: string | null;
          card_id: string | null;  // NFC/magnetic card ID for card-based auth
          name: string;  // Full name (parse to first/last as needed)
          role: 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior' | 'admin';
          store_ids: string[];
          status: 'active' | 'inactive' | 'suspended';  // Changed from is_active boolean
          phone: string | null;
          avatar_url: string | null;
          permissions: Json | null;
          last_login_at: string | null;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          email: string;
          password_hash: string;
          pin?: string | null;
          card_id?: string | null;
          name: string;
          role?: 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior' | 'admin';
          store_ids?: string[];
          status?: 'active' | 'inactive' | 'suspended';
          phone?: string | null;
          avatar_url?: string | null;
          permissions?: Json | null;
          last_login_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };

      // Tenants (franchise/business grouping)
      tenants: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          company: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          company?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };

      // Licenses (subscription management)
      licenses: {
        Row: {
          id: string;
          tenant_id: string;
          tier: 'starter' | 'growth' | 'pro' | 'enterprise';
          max_stores: number;
          max_devices_per_store: number;
          status: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          tier?: 'starter' | 'growth' | 'pro' | 'enterprise';
          max_stores?: number;
          max_devices_per_store?: number;
          status?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['licenses']['Insert']>;
      };

      // Business Data tables
      clients: {
        Row: {
          id: string;
          store_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
          is_blocked: boolean;
          is_vip: boolean;
          preferences: Json;
          loyalty_info: Json;
          visit_summary: Json;
          tags: Json;
          notes: Json;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email?: string | null;
          is_blocked?: boolean;
          is_vip?: boolean;
          preferences?: Json;
          loyalty_info?: Json;
          visit_summary?: Json;
          tags?: Json;
          notes?: Json;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };

      staff: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          status: string;
          is_active: boolean;
          schedule: Json;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          status?: string;
          is_active?: boolean;
          schedule?: Json;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
      };

      services: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          category: string | null;
          duration: number;
          price: number;
          is_active: boolean;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          category?: string | null;
          duration: number;
          price: number;
          is_active?: boolean;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };

      appointments: {
        Row: {
          id: string;
          store_id: string;
          client_id: string | null;
          client_name: string;
          staff_id: string | null;
          services: Json;
          status: string;
          scheduled_start_time: string;
          scheduled_end_time: string;
          notes: string | null;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          client_id?: string | null;
          client_name: string;
          staff_id?: string | null;
          services?: Json;
          status?: string;
          scheduled_start_time: string;
          scheduled_end_time: string;
          notes?: string | null;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };

      tickets: {
        Row: {
          id: string;
          store_id: string;
          appointment_id: string | null;
          client_id: string | null;
          client_name: string;
          services: Json;
          products: Json;
          status: string;
          subtotal: number;
          discount: number;
          tax: number;
          tip: number;
          total: number;
          payments: Json;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          appointment_id?: string | null;
          client_id?: string | null;
          client_name: string;
          services?: Json;
          products?: Json;
          status?: string;
          subtotal?: number;
          discount?: number;
          tax?: number;
          tip?: number;
          total?: number;
          payments?: Json;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };

      transactions: {
        Row: {
          id: string;
          store_id: string;
          ticket_id: string | null;
          client_id: string | null;
          type: string;
          payment_method: string;
          amount: number;
          tip: number;
          total: number;
          status: string;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          ticket_id?: string | null;
          client_id?: string | null;
          type: string;
          payment_method: string;
          amount: number;
          tip?: number;
          total: number;
          status?: string;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types for table rows
export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type StaffRow = Database['public']['Tables']['staff']['Row'];
export type StaffInsert = Database['public']['Tables']['staff']['Insert'];
export type StaffUpdate = Database['public']['Tables']['staff']['Update'];

export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type TicketRow = Database['public']['Tables']['tickets']['Row'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];

export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Auth-related types
export type StoreRow = Database['public']['Tables']['stores']['Row'];
export type StoreInsert = Database['public']['Tables']['stores']['Insert'];
export type StoreUpdate = Database['public']['Tables']['stores']['Update'];

export type MemberRow = Database['public']['Tables']['members']['Row'];
export type MemberInsert = Database['public']['Tables']['members']['Insert'];
export type MemberUpdate = Database['public']['Tables']['members']['Update'];

export type TenantRow = Database['public']['Tables']['tenants']['Row'];
export type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
export type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

export type LicenseRow = Database['public']['Tables']['licenses']['Row'];
export type LicenseInsert = Database['public']['Tables']['licenses']['Insert'];
export type LicenseUpdate = Database['public']['Tables']['licenses']['Update'];

// Auth session types for the application
export type MemberRole = 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior' | 'admin';
export type LicenseTier = 'starter' | 'growth' | 'pro' | 'enterprise';
