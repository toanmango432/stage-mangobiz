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
          // New fields from migration 008
          role: StaffRole;
          hire_date: string | null;
          employment_type: EmploymentType;
          termination_date: string | null;
          commission_settings: Json;
          wage_settings: Json;
          online_booking_settings: Json;
          permissions: Json;
          professional_profile: Json;
          hr_info: Json;
          notification_preferences: Json;
          performance_goals: Json;
          turn_queue_position: number;
          daily_turn_count: number;
          daily_revenue: number;
          clocked_in_at: string | null;
          current_ticket_id: string | null;
          average_rating: number;
          total_reviews: number;
          service_assignments: Json;
          // Sync fields
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
          role?: StaffRole;
          hire_date?: string | null;
          employment_type?: EmploymentType;
          termination_date?: string | null;
          commission_settings?: Json;
          wage_settings?: Json;
          online_booking_settings?: Json;
          permissions?: Json;
          professional_profile?: Json;
          hr_info?: Json;
          notification_preferences?: Json;
          performance_goals?: Json;
          turn_queue_position?: number;
          daily_turn_count?: number;
          daily_revenue?: number;
          clocked_in_at?: string | null;
          current_ticket_id?: string | null;
          average_rating?: number;
          total_reviews?: number;
          service_assignments?: Json;
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
          /** Service archive status - 'active' for available services, 'archived' for hidden services */
          status: 'active' | 'archived';
          /** ISO timestamp when the service was archived, null if active */
          archived_at: string | null;
          /** User ID of who archived the service, null if active */
          archived_by: string | null;
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
          /** Service archive status - defaults to 'active' */
          status?: 'active' | 'archived';
          /** ISO timestamp when archived, null for active services */
          archived_at?: string | null;
          /** User ID of who archived, null for active services */
          archived_by?: string | null;
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

      // Team Module Tables (migrations 009-013)

      timesheets: {
        Row: {
          id: string;
          store_id: string;
          staff_id: string;
          date: string;
          scheduled_start: string | null;
          scheduled_end: string | null;
          scheduled_break_minutes: number;
          actual_clock_in: string | null;
          actual_clock_out: string | null;
          breaks: Json;
          hours: Json;
          is_late_arrival: boolean;
          is_early_departure: boolean;
          is_no_show: boolean;
          late_minutes: number;
          early_departure_minutes: number;
          status: TimesheetStatus;
          approved_by: string | null;
          approved_at: string | null;
          dispute_reason: string | null;
          dispute_notes: string | null;
          notes: string | null;
          manager_notes: string | null;
          clock_in_location: Json | null;
          clock_out_location: Json | null;
          clock_in_photo_url: string | null;
          clock_out_photo_url: string | null;
          sync_status: string;
          sync_version: number;
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          staff_id: string;
          date: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          scheduled_break_minutes?: number;
          actual_clock_in?: string | null;
          actual_clock_out?: string | null;
          breaks?: Json;
          hours?: Json;
          is_late_arrival?: boolean;
          is_early_departure?: boolean;
          is_no_show?: boolean;
          late_minutes?: number;
          early_departure_minutes?: number;
          status?: TimesheetStatus;
          approved_by?: string | null;
          approved_at?: string | null;
          dispute_reason?: string | null;
          dispute_notes?: string | null;
          notes?: string | null;
          manager_notes?: string | null;
          clock_in_location?: Json | null;
          clock_out_location?: Json | null;
          clock_in_photo_url?: string | null;
          clock_out_photo_url?: string | null;
          sync_status?: string;
          sync_version?: number;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['timesheets']['Insert']>;
      };

      pay_runs: {
        Row: {
          id: string;
          store_id: string;
          tenant_id: string | null;
          period_start: string;
          period_end: string;
          pay_date: string | null;
          pay_period_type: PayPeriodType;
          status: PayRunStatus;
          staff_payments: Json;
          totals: Json;
          submitted_by: string | null;
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          approval_notes: string | null;
          processed_by: string | null;
          processed_at: string | null;
          processing_notes: string | null;
          payment_method: string | null;
          voided_by: string | null;
          voided_at: string | null;
          void_reason: string | null;
          rejected_by: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          notes: string | null;
          sync_status: string;
          sync_version: number;
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          tenant_id?: string | null;
          period_start: string;
          period_end: string;
          pay_date?: string | null;
          pay_period_type?: PayPeriodType;
          status?: PayRunStatus;
          staff_payments?: Json;
          totals?: Json;
          submitted_by?: string | null;
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_notes?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          processing_notes?: string | null;
          payment_method?: string | null;
          voided_by?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          rejected_by?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          notes?: string | null;
          sync_status?: string;
          sync_version?: number;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['pay_runs']['Insert']>;
      };

      turn_logs: {
        Row: {
          id: string;
          store_id: string;
          staff_id: string;
          date: string;
          turn_number: number;
          turn_type: TurnType;
          turn_value: number;
          ticket_id: string | null;
          appointment_id: string | null;
          client_name: string | null;
          services: string[] | null;
          service_amount: number;
          adjustment_reason: string | null;
          adjusted_by: string | null;
          is_voided: boolean;
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          turn_timestamp: string;
          created_by: string | null;
          created_by_device: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          staff_id: string;
          date?: string;
          turn_number: number;
          turn_type: TurnType;
          turn_value?: number;
          ticket_id?: string | null;
          appointment_id?: string | null;
          client_name?: string | null;
          services?: string[] | null;
          service_amount?: number;
          adjustment_reason?: string | null;
          adjusted_by?: string | null;
          is_voided?: boolean;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          turn_timestamp?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['turn_logs']['Insert']>;
      };

      time_off_requests: {
        Row: {
          id: string;
          store_id: string;
          staff_id: string;
          request_type: TimeOffType;
          start_date: string;
          end_date: string;
          all_day: boolean;
          start_time: string | null;
          end_time: string | null;
          notes: string | null;
          reason: string | null;
          total_hours: number | null;
          status: TimeOffStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          has_conflicts: boolean;
          conflict_details: Json | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          sync_status: string;
          sync_version: number;
          created_by: string | null;
          created_by_device: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          staff_id: string;
          request_type: TimeOffType;
          start_date: string;
          end_date: string;
          all_day?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          notes?: string | null;
          reason?: string | null;
          total_hours?: number | null;
          status?: TimeOffStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          has_conflicts?: boolean;
          conflict_details?: Json | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          sync_status?: string;
          sync_version?: number;
          created_by?: string | null;
          created_by_device?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['time_off_requests']['Insert']>;
      };

      staff_ratings: {
        Row: {
          id: string;
          store_id: string;
          staff_id: string;
          client_id: string | null;
          client_name: string | null;
          appointment_id: string | null;
          ticket_id: string | null;
          rating: number;
          review_text: string | null;
          is_public: boolean;
          is_verified: boolean;
          status: RatingStatus;
          flagged_reason: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          moderation_notes: string | null;
          response_text: string | null;
          response_by: string | null;
          response_at: string | null;
          services_performed: string[] | null;
          service_date: string | null;
          source: RatingSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          staff_id: string;
          client_id?: string | null;
          client_name?: string | null;
          appointment_id?: string | null;
          ticket_id?: string | null;
          rating: number;
          review_text?: string | null;
          is_public?: boolean;
          is_verified?: boolean;
          status?: RatingStatus;
          flagged_reason?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_notes?: string | null;
          response_text?: string | null;
          response_by?: string | null;
          response_at?: string | null;
          services_performed?: string[] | null;
          service_date?: string | null;
          source?: RatingSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_ratings']['Insert']>;
      };

      // MQTT Device Discovery (migration 014) + Device Pairing (migration 028)
      salon_devices: {
        Row: {
          id: string;
          store_id: string;
          device_fingerprint: string;
          device_name: string | null;
          device_type: SalonDeviceType;
          mqtt_client_id: string | null;
          local_ip: string | null;
          mqtt_port: number;
          is_hub: boolean;
          is_online: boolean;
          last_seen_at: string;
          capabilities: Json;
          settings: Json;
          // Device Pairing columns (migration 028)
          device_role: SalonDeviceRole | null;
          station_name: string | null;
          pairing_code: string | null;
          paired_to_device_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          device_fingerprint: string;
          device_name?: string | null;
          device_type: SalonDeviceType;
          mqtt_client_id?: string | null;
          local_ip?: string | null;
          mqtt_port?: number;
          is_hub?: boolean;
          is_online?: boolean;
          last_seen_at?: string;
          capabilities?: Json;
          settings?: Json;
          // Device Pairing columns (migration 028)
          device_role?: SalonDeviceRole | null;
          station_name?: string | null;
          pairing_code?: string | null;
          paired_to_device_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['salon_devices']['Insert']>;
      };

      // Gift Cards Tables (migration 019)
      gift_cards: {
        Row: {
          id: string;
          store_id: string;
          code: string;
          initial_balance: number;
          current_balance: number;
          status: GiftCardStatus;
          card_type: GiftCardType;
          purchased_by: string | null;
          purchased_at: string | null;
          purchase_amount: number | null;
          order_id: string | null;
          recipient_email: string | null;
          recipient_name: string | null;
          recipient_phone: string | null;
          personal_message: string | null;
          delivery_method: GiftCardDeliveryMethod;
          delivered_at: string | null;
          delivery_scheduled_at: string | null;
          design_template: string;
          custom_image_url: string | null;
          expires_at: string | null;
          is_reloadable: boolean;
          // Email tracking (migration 027)
          email_status: GiftCardEmailStatus;
          email_message_id: string | null;
          email_sent_at: string | null;
          email_delivered_at: string | null;
          email_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          code: string;
          initial_balance: number;
          current_balance: number;
          status?: GiftCardStatus;
          card_type?: GiftCardType;
          purchased_by?: string | null;
          purchased_at?: string | null;
          purchase_amount?: number | null;
          order_id?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          personal_message?: string | null;
          delivery_method?: GiftCardDeliveryMethod;
          delivered_at?: string | null;
          delivery_scheduled_at?: string | null;
          design_template?: string;
          custom_image_url?: string | null;
          expires_at?: string | null;
          is_reloadable?: boolean;
          // Email tracking (migration 027)
          email_status?: GiftCardEmailStatus;
          email_message_id?: string | null;
          email_sent_at?: string | null;
          email_delivered_at?: string | null;
          email_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gift_cards']['Insert']>;
      };

      gift_card_transactions: {
        Row: {
          id: string;
          gift_card_id: string;
          store_id: string;
          transaction_type: GiftCardTransactionType;
          amount: number;
          balance_before: number;
          balance_after: number;
          ticket_id: string | null;
          order_id: string | null;
          client_id: string | null;
          notes: string | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_card_id: string;
          store_id: string;
          transaction_type: GiftCardTransactionType;
          amount: number;
          balance_before: number;
          balance_after: number;
          ticket_id?: string | null;
          order_id?: string | null;
          client_id?: string | null;
          notes?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gift_card_transactions']['Insert']>;
      };

      client_gift_cards: {
        Row: {
          id: string;
          client_id: string;
          gift_card_id: string;
          store_id: string;
          acquisition_type: GiftCardAcquisitionType;
          nickname: string | null;
          is_favorite: boolean;
          added_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          gift_card_id: string;
          store_id: string;
          acquisition_type?: GiftCardAcquisitionType;
          nickname?: string | null;
          is_favorite?: boolean;
          added_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_gift_cards']['Insert']>;
      };

      // ============================================
      // CATALOG MODULE TABLES (migration 031)
      // ============================================

      service_categories: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Core fields
          name: string;
          description: string | null;
          color: string;
          icon: string | null;
          display_order: number;
          is_active: boolean;
          // Hierarchy
          parent_category_id: string | null;
          // Online booking
          show_online_booking: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          name: string;
          description?: string | null;
          color?: string;
          icon?: string | null;
          display_order?: number;
          is_active?: boolean;
          parent_category_id?: string | null;
          show_online_booking?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_categories']['Insert']>;
      };

      menu_services: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Foreign key
          category_id: string;
          // Core fields
          name: string;
          description: string | null;
          sku: string | null;
          // Pricing
          pricing_type: PricingType;
          price: number;
          price_max: number | null;
          cost: number | null;
          taxable: boolean;
          // Duration
          duration: number;
          // Extra time (Fresha-style)
          extra_time: number | null;
          extra_time_type: ExtraTimeType | null;
          // Client care
          aftercare_instructions: string | null;
          requires_patch_test: boolean;
          // Variants
          has_variants: boolean;
          variant_count: number;
          // Staff assignment
          all_staff_can_perform: boolean;
          // Booking settings
          booking_availability: BookingAvailability;
          online_booking_enabled: boolean;
          requires_deposit: boolean;
          deposit_amount: number | null;
          deposit_percentage: number | null;
          // Online booking limits
          online_booking_buffer_minutes: number | null;
          advance_booking_days_min: number | null;
          advance_booking_days_max: number | null;
          // Rebook reminder
          rebook_reminder_days: number | null;
          // Turn weight
          turn_weight: number;
          // Additional settings
          commission_rate: number | null;
          color: string | null;
          images: string[] | null;
          tags: string[] | null;
          // Status
          status: ServiceStatus;
          display_order: number;
          show_price_online: boolean;
          allow_custom_duration: boolean;
          // Archive
          archived_at: string | null;
          archived_by: string | null;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          category_id: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          pricing_type?: PricingType;
          price?: number;
          price_max?: number | null;
          cost?: number | null;
          taxable?: boolean;
          duration?: number;
          extra_time?: number | null;
          extra_time_type?: ExtraTimeType | null;
          aftercare_instructions?: string | null;
          requires_patch_test?: boolean;
          has_variants?: boolean;
          variant_count?: number;
          all_staff_can_perform?: boolean;
          booking_availability?: BookingAvailability;
          online_booking_enabled?: boolean;
          requires_deposit?: boolean;
          deposit_amount?: number | null;
          deposit_percentage?: number | null;
          online_booking_buffer_minutes?: number | null;
          advance_booking_days_min?: number | null;
          advance_booking_days_max?: number | null;
          rebook_reminder_days?: number | null;
          turn_weight?: number;
          commission_rate?: number | null;
          color?: string | null;
          images?: string[] | null;
          tags?: string[] | null;
          status?: ServiceStatus;
          display_order?: number;
          show_price_online?: boolean;
          allow_custom_duration?: boolean;
          archived_at?: string | null;
          archived_by?: string | null;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['menu_services']['Insert']>;
      };

      service_variants: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Foreign key
          service_id: string;
          // Core fields
          name: string;
          duration: number;
          price: number;
          // Extra time
          extra_time: number | null;
          extra_time_type: ExtraTimeType | null;
          // Status
          is_default: boolean;
          display_order: number;
          is_active: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          service_id: string;
          name: string;
          duration: number;
          price: number;
          extra_time?: number | null;
          extra_time_type?: ExtraTimeType | null;
          is_default?: boolean;
          display_order?: number;
          is_active?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_variants']['Insert']>;
      };

      service_packages: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Core fields
          name: string;
          description: string | null;
          // Services (JSONB array)
          services: Json;
          // Pricing
          original_price: number;
          package_price: number;
          discount_type: DiscountType;
          discount_value: number;
          // Booking mode
          booking_mode: BookingMode;
          // Validity
          validity_days: number | null;
          usage_limit: number | null;
          // Booking settings
          booking_availability: BookingAvailability;
          online_booking_enabled: boolean;
          // Staff restrictions
          restricted_staff_ids: string[] | null;
          // Status
          is_active: boolean;
          display_order: number;
          // Visual
          color: string | null;
          images: string[] | null;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          name: string;
          description?: string | null;
          services?: Json;
          original_price?: number;
          package_price?: number;
          discount_type?: DiscountType;
          discount_value?: number;
          booking_mode?: BookingMode;
          validity_days?: number | null;
          usage_limit?: number | null;
          booking_availability?: BookingAvailability;
          online_booking_enabled?: boolean;
          restricted_staff_ids?: string[] | null;
          is_active?: boolean;
          display_order?: number;
          color?: string | null;
          images?: string[] | null;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_packages']['Insert']>;
      };

      add_on_groups: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Core fields
          name: string;
          description: string | null;
          // Selection rules
          selection_mode: SelectionMode;
          min_selections: number;
          max_selections: number | null;
          is_required: boolean;
          // Applicability
          applicable_to_all: boolean;
          applicable_category_ids: string[];
          applicable_service_ids: string[];
          // Status
          is_active: boolean;
          display_order: number;
          online_booking_enabled: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          name: string;
          description?: string | null;
          selection_mode?: SelectionMode;
          min_selections?: number;
          max_selections?: number | null;
          is_required?: boolean;
          applicable_to_all?: boolean;
          applicable_category_ids?: string[];
          applicable_service_ids?: string[];
          is_active?: boolean;
          display_order?: number;
          online_booking_enabled?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['add_on_groups']['Insert']>;
      };

      add_on_options: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Foreign key
          group_id: string;
          // Core fields
          name: string;
          description: string | null;
          // Pricing & Duration
          price: number;
          duration: number;
          // Status
          is_active: boolean;
          display_order: number;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          group_id: string;
          name: string;
          description?: string | null;
          price?: number;
          duration?: number;
          is_active?: boolean;
          display_order?: number;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['add_on_options']['Insert']>;
      };

      staff_service_assignments: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Assignment relationship
          staff_id: string;
          service_id: string;
          // Custom pricing/duration
          custom_price: number | null;
          custom_duration: number | null;
          custom_commission_rate: number | null;
          // Status
          is_active: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          staff_id: string;
          service_id: string;
          custom_price?: number | null;
          custom_duration?: number | null;
          custom_commission_rate?: number | null;
          is_active?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['staff_service_assignments']['Insert']>;
      };

      catalog_settings: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Default values
          default_duration: number;
          default_extra_time: number;
          default_extra_time_type: ExtraTimeType;
          // Pricing defaults
          default_tax_rate: number;
          currency: string;
          currency_symbol: string;
          // Online booking defaults
          show_prices_online: boolean;
          require_deposit_for_online_booking: boolean;
          default_deposit_percentage: number;
          // Feature toggles
          enable_packages: boolean;
          enable_add_ons: boolean;
          enable_variants: boolean;
          allow_custom_pricing: boolean;
          booking_sequence_enabled: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          default_duration?: number;
          default_extra_time?: number;
          default_extra_time_type?: ExtraTimeType;
          default_tax_rate?: number;
          currency?: string;
          currency_symbol?: string;
          show_prices_online?: boolean;
          require_deposit_for_online_booking?: boolean;
          default_deposit_percentage?: number;
          enable_packages?: boolean;
          enable_add_ons?: boolean;
          enable_variants?: boolean;
          allow_custom_pricing?: boolean;
          booking_sequence_enabled?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['catalog_settings']['Insert']>;
      };

      booking_sequences: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Ordered list of service IDs (JSONB array)
          service_order: Json;
          // Status
          is_enabled: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          service_order?: Json;
          is_enabled?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['booking_sequences']['Insert']>;
      };

      catalog_products: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Identifiers
          sku: string;
          barcode: string | null;
          // Core fields
          name: string;
          brand: string;
          category: string;
          description: string | null;
          // Pricing
          retail_price: number;
          cost_price: number;
          margin: number;
          // Product type
          is_retail: boolean;
          is_backbar: boolean;
          // Inventory management
          min_stock_level: number;
          reorder_quantity: number | null;
          // Supplier
          supplier_id: string | null;
          supplier_name: string | null;
          // Visual
          image_url: string | null;
          // Size/unit
          size: string | null;
          backbar_unit: string | null;
          backbar_uses_per_unit: number | null;
          // Status
          is_active: boolean;
          is_tax_exempt: boolean;
          // Commission
          commission_rate: number | null;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          sku: string;
          barcode?: string | null;
          name: string;
          brand: string;
          category: string;
          description?: string | null;
          retail_price?: number;
          cost_price?: number;
          margin?: number;
          is_retail?: boolean;
          is_backbar?: boolean;
          min_stock_level?: number;
          reorder_quantity?: number | null;
          supplier_id?: string | null;
          supplier_name?: string | null;
          image_url?: string | null;
          size?: string | null;
          backbar_unit?: string | null;
          backbar_uses_per_unit?: number | null;
          is_active?: boolean;
          is_tax_exempt?: boolean;
          commission_rate?: number | null;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['catalog_products']['Insert']>;
      };

      catalog_gift_card_denominations: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Core fields
          amount: number;
          label: string | null;
          // Status
          is_active: boolean;
          display_order: number;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          amount: number;
          label?: string | null;
          is_active?: boolean;
          display_order?: number;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['catalog_gift_card_denominations']['Insert']>;
      };

      catalog_gift_card_settings: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          location_id: string | null;
          // Custom amount settings
          allow_custom_amount: boolean;
          min_amount: number;
          max_amount: number;
          // Expiration
          default_expiration_days: number | null;
          // Online settings
          online_enabled: boolean;
          email_delivery_enabled: boolean;
          // Sync metadata
          sync_status: SyncStatus;
          version: number;
          vector_clock: Json;
          last_synced_version: number;
          // Timestamps
          created_at: string;
          updated_at: string;
          // Audit trail
          created_by: string | null;
          created_by_device: string | null;
          last_modified_by: string | null;
          last_modified_by_device: string | null;
          // Soft delete
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_by_device: string | null;
          tombstone_expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          location_id?: string | null;
          allow_custom_amount?: boolean;
          min_amount?: number;
          max_amount?: number;
          default_expiration_days?: number | null;
          online_enabled?: boolean;
          email_delivery_enabled?: boolean;
          sync_status?: SyncStatus;
          version?: number;
          vector_clock?: Json;
          last_synced_version?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          created_by_device?: string | null;
          last_modified_by?: string | null;
          last_modified_by_device?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_by_device?: string | null;
          tombstone_expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['catalog_gift_card_settings']['Insert']>;
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

// Team Module Enums (matching migrations 008-013)
export type StaffRole =
  | 'owner'
  | 'manager'
  | 'senior_stylist'
  | 'stylist'
  | 'junior_stylist'
  | 'apprentice'
  | 'barber'
  | 'colorist'
  | 'nail_technician'
  | 'esthetician'
  | 'massage_therapist'
  | 'makeup_artist'
  | 'receptionist'
  | 'assistant';

export type EmploymentType = 'full-time' | 'part-time' | 'contractor' | 'temporary';

export type TimesheetStatus = 'pending' | 'approved' | 'disputed' | 'auto_approved';

export type PayRunStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'processed'
  | 'voided'
  | 'rejected';

export type PayPeriodType = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

export type TurnType =
  | 'service'
  | 'checkout'
  | 'bonus'
  | 'adjust'
  | 'tardy'
  | 'partial'
  | 'void'
  | 'appointment';

export type TimeOffType =
  | 'vacation'
  | 'sick'
  | 'personal'
  | 'unpaid'
  | 'bereavement'
  | 'jury_duty'
  | 'other';

export type TimeOffStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'expired';

export type RatingStatus = 'active' | 'hidden' | 'flagged' | 'removed' | 'pending_review';

export type RatingSource = 'in_app' | 'online_booking' | 'google' | 'yelp' | 'imported';

// Team Module Table Types
export type TimesheetRow = Database['public']['Tables']['timesheets']['Row'];
export type TimesheetInsert = Database['public']['Tables']['timesheets']['Insert'];
export type TimesheetUpdate = Database['public']['Tables']['timesheets']['Update'];

export type PayRunRow = Database['public']['Tables']['pay_runs']['Row'];
export type PayRunInsert = Database['public']['Tables']['pay_runs']['Insert'];
export type PayRunUpdate = Database['public']['Tables']['pay_runs']['Update'];

export type TurnLogRow = Database['public']['Tables']['turn_logs']['Row'];
export type TurnLogInsert = Database['public']['Tables']['turn_logs']['Insert'];
export type TurnLogUpdate = Database['public']['Tables']['turn_logs']['Update'];

export type TimeOffRequestRow = Database['public']['Tables']['time_off_requests']['Row'];
export type TimeOffRequestInsert = Database['public']['Tables']['time_off_requests']['Insert'];
export type TimeOffRequestUpdate = Database['public']['Tables']['time_off_requests']['Update'];

export type StaffRatingRow = Database['public']['Tables']['staff_ratings']['Row'];
export type StaffRatingInsert = Database['public']['Tables']['staff_ratings']['Insert'];
export type StaffRatingUpdate = Database['public']['Tables']['staff_ratings']['Update'];

// MQTT Device Discovery Types (migration 014)
export type SalonDeviceType = 'ios' | 'android' | 'web' | 'desktop';

// Device Pairing Types (migration 028)
// device_role identifies what the device does (app role)
// device_type identifies the platform (ios, android, web, desktop)
export type SalonDeviceRole = 'store-app' | 'mango-pad' | 'check-in' | 'display';

export type SalonDeviceRow = Database['public']['Tables']['salon_devices']['Row'];
export type SalonDeviceInsert = Database['public']['Tables']['salon_devices']['Insert'];
export type SalonDeviceUpdate = Database['public']['Tables']['salon_devices']['Update'];

// Device capabilities interface for type safety
export interface DeviceCapabilities {
  tapToPay?: boolean;
  printer?: boolean;
  scanner?: boolean;
  nfc?: boolean;
  signatureCapture?: boolean;
}

// Device settings interface
export interface DeviceSettings {
  autoConnect?: boolean;
  preferLocalBroker?: boolean;
  heartbeatInterval?: number;
}

// Gift Card Enums (migration 019)
export type GiftCardStatus = 'active' | 'used' | 'expired' | 'cancelled' | 'pending';
export type GiftCardType = 'standard' | 'promotional' | 'reward' | 'refund';
export type GiftCardDeliveryMethod = 'email' | 'sms' | 'print' | 'physical';
export type GiftCardTransactionType = 'purchase' | 'redemption' | 'reload' | 'refund' | 'adjustment' | 'expiry';
export type GiftCardAcquisitionType = 'purchased' | 'received' | 'reward' | 'refund';
// Email tracking (migration 027)
export type GiftCardEmailStatus = 'pending' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'bounced';

// Catalog Module Enums (migration 031)
export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict' | 'error';
export type PricingType = 'fixed' | 'from' | 'free' | 'varies' | 'hourly';
export type ServiceStatus = 'active' | 'inactive' | 'archived';
export type BookingAvailability = 'online' | 'in-store' | 'both' | 'disabled';
export type ExtraTimeType = 'processing' | 'blocked' | 'finishing';
export type DiscountType = 'fixed' | 'percentage';
export type BookingMode = 'single-session' | 'multiple-visits';
export type SelectionMode = 'single' | 'multiple';

// Gift Card Table Types
export type GiftCardRow = Database['public']['Tables']['gift_cards']['Row'];
export type GiftCardInsert = Database['public']['Tables']['gift_cards']['Insert'];
export type GiftCardUpdate = Database['public']['Tables']['gift_cards']['Update'];

export type GiftCardTransactionRow = Database['public']['Tables']['gift_card_transactions']['Row'];
export type GiftCardTransactionInsert = Database['public']['Tables']['gift_card_transactions']['Insert'];
export type GiftCardTransactionUpdate = Database['public']['Tables']['gift_card_transactions']['Update'];

export type ClientGiftCardRow = Database['public']['Tables']['client_gift_cards']['Row'];
export type ClientGiftCardInsert = Database['public']['Tables']['client_gift_cards']['Insert'];
export type ClientGiftCardUpdate = Database['public']['Tables']['client_gift_cards']['Update'];

// Catalog Module Table Types (migration 031)
export type ServiceCategoryRow = Database['public']['Tables']['service_categories']['Row'];
export type ServiceCategoryInsert = Database['public']['Tables']['service_categories']['Insert'];
export type ServiceCategoryUpdate = Database['public']['Tables']['service_categories']['Update'];

export type MenuServiceRow = Database['public']['Tables']['menu_services']['Row'];
export type MenuServiceInsert = Database['public']['Tables']['menu_services']['Insert'];
export type MenuServiceUpdate = Database['public']['Tables']['menu_services']['Update'];

export type ServiceVariantRow = Database['public']['Tables']['service_variants']['Row'];
export type ServiceVariantInsert = Database['public']['Tables']['service_variants']['Insert'];
export type ServiceVariantUpdate = Database['public']['Tables']['service_variants']['Update'];

export type ServicePackageRow = Database['public']['Tables']['service_packages']['Row'];
export type ServicePackageInsert = Database['public']['Tables']['service_packages']['Insert'];
export type ServicePackageUpdate = Database['public']['Tables']['service_packages']['Update'];

export type AddOnGroupRow = Database['public']['Tables']['add_on_groups']['Row'];
export type AddOnGroupInsert = Database['public']['Tables']['add_on_groups']['Insert'];
export type AddOnGroupUpdate = Database['public']['Tables']['add_on_groups']['Update'];

export type AddOnOptionRow = Database['public']['Tables']['add_on_options']['Row'];
export type AddOnOptionInsert = Database['public']['Tables']['add_on_options']['Insert'];
export type AddOnOptionUpdate = Database['public']['Tables']['add_on_options']['Update'];

export type StaffServiceAssignmentRow = Database['public']['Tables']['staff_service_assignments']['Row'];
export type StaffServiceAssignmentInsert = Database['public']['Tables']['staff_service_assignments']['Insert'];
export type StaffServiceAssignmentUpdate = Database['public']['Tables']['staff_service_assignments']['Update'];

export type CatalogSettingsRow = Database['public']['Tables']['catalog_settings']['Row'];
export type CatalogSettingsInsert = Database['public']['Tables']['catalog_settings']['Insert'];
export type CatalogSettingsUpdate = Database['public']['Tables']['catalog_settings']['Update'];

export type BookingSequenceRow = Database['public']['Tables']['booking_sequences']['Row'];
export type BookingSequenceInsert = Database['public']['Tables']['booking_sequences']['Insert'];
export type BookingSequenceUpdate = Database['public']['Tables']['booking_sequences']['Update'];

export type CatalogProductRow = Database['public']['Tables']['catalog_products']['Row'];
export type CatalogProductInsert = Database['public']['Tables']['catalog_products']['Insert'];
export type CatalogProductUpdate = Database['public']['Tables']['catalog_products']['Update'];

export type CatalogGiftCardDenominationRow = Database['public']['Tables']['catalog_gift_card_denominations']['Row'];
export type CatalogGiftCardDenominationInsert = Database['public']['Tables']['catalog_gift_card_denominations']['Insert'];
export type CatalogGiftCardDenominationUpdate = Database['public']['Tables']['catalog_gift_card_denominations']['Update'];

export type CatalogGiftCardSettingsRow = Database['public']['Tables']['catalog_gift_card_settings']['Row'];
export type CatalogGiftCardSettingsInsert = Database['public']['Tables']['catalog_gift_card_settings']['Insert'];
export type CatalogGiftCardSettingsUpdate = Database['public']['Tables']['catalog_gift_card_settings']['Update'];
