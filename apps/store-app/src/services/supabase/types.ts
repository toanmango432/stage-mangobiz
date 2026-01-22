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
          mfa_method: 'none' | 'email_otp' | 'sms_otp' | 'totp' | null;  // Two-factor authentication method
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
          mfa_method?: 'none' | 'email_otp' | 'sms_otp' | 'totp' | null;
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
          // Merge tracking columns (migration 031)
          merged_into_id: string | null;
          merged_at: string | null;
          merged_by: string | null;
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
          // Merge tracking columns (migration 031)
          merged_into_id?: string | null;
          merged_at?: string | null;
          merged_by?: string | null;
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
          /** Form template IDs to automatically send when this service is booked (migration 033) */
          auto_send_form_ids: string[];
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
          /** Form template IDs to automatically send when this service is booked */
          auto_send_form_ids?: string[];
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

      // Portfolio Items (migration 001)
      portfolio_items: {
        Row: {
          id: string;
          store_id: string;
          staff_id: string;
          image_url: string;
          thumbnail_url: string | null;
          title: string | null;
          description: string | null;
          service_id: string | null;
          service_name: string | null;
          tags: string[];
          is_featured: boolean;
          is_before_after: boolean;
          before_image_url: string | null;
          likes: number;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          staff_id: string;
          image_url: string;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          service_id?: string | null;
          service_name?: string | null;
          tags?: string[];
          is_featured?: boolean;
          is_before_after?: boolean;
          before_image_url?: string | null;
          likes?: number;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['portfolio_items']['Insert']>;
      };

      // Form System Tables (migration 033)
      form_templates: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          description: string | null;
          category: FormTemplateCategory | null;
          send_mode: FormSendMode;
          frequency: FormFrequencyDb | null;
          linked_service_ids: string[];
          requires_signature: boolean;
          send_before_hours: number | null;
          reminder_enabled: boolean | null;
          reminder_interval_hours: number | null;
          expiration_hours: number | null;
          sections: Json;
          is_active: boolean;
          is_built_in: boolean;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          category?: FormTemplateCategory | null;
          send_mode?: FormSendMode;
          frequency?: FormFrequencyDb | null;
          linked_service_ids?: string[];
          requires_signature?: boolean;
          send_before_hours?: number | null;
          reminder_enabled?: boolean | null;
          reminder_interval_hours?: number | null;
          expiration_hours?: number | null;
          sections?: Json;
          is_active?: boolean;
          is_built_in?: boolean;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['form_templates']['Insert']>;
      };

      form_submissions: {
        Row: {
          id: string;
          store_id: string;
          form_template_id: string;
          client_id: string | null;
          appointment_id: string | null;
          responses: Json;
          signature_image: string | null;
          signature_type: FormSignatureType | null;
          signature_typed_name: string | null;
          status: FormSubmissionStatus;
          sent_at: string | null;
          sent_via: FormSentVia | null;
          started_at: string | null;
          completed_at: string | null;
          expires_at: string | null;
          completed_by: string | null;
          ip_address: string | null;
          user_agent: string | null;
          sync_status: string;
          sync_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          form_template_id: string;
          client_id?: string | null;
          appointment_id?: string | null;
          responses?: Json;
          signature_image?: string | null;
          signature_type?: FormSignatureType | null;
          signature_typed_name?: string | null;
          status?: FormSubmissionStatus;
          sent_at?: string | null;
          sent_via?: FormSentVia | null;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          completed_by?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          sync_status?: string;
          sync_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['form_submissions']['Insert']>;
      };

      form_deliveries: {
        Row: {
          id: string;
          store_id: string;
          form_template_id: string;
          client_id: string;
          appointment_id: string | null;
          form_submission_id: string | null;
          delivery_method: FormDeliveryMethodDb;
          token: string;
          delivery_email: string | null;
          delivery_phone: string | null;
          sent_at: string;
          opened_at: string | null;
          completed_at: string | null;
          expires_at: string;
          delivery_status: FormDeliveryStatus;
          delivery_error: string | null;
          message_id: string | null;
          reminder_sent_at: string | null;
          reminder_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          form_template_id: string;
          client_id: string;
          appointment_id?: string | null;
          form_submission_id?: string | null;
          delivery_method: FormDeliveryMethodDb;
          token?: string;
          delivery_email?: string | null;
          delivery_phone?: string | null;
          sent_at?: string;
          opened_at?: string | null;
          completed_at?: string | null;
          expires_at: string;
          delivery_status?: FormDeliveryStatus;
          delivery_error?: string | null;
          message_id?: string | null;
          reminder_sent_at?: string | null;
          reminder_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['form_deliveries']['Insert']>;
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

// Portfolio Table Types
export type PortfolioItemRow = Database['public']['Tables']['portfolio_items']['Row'];
export type PortfolioItemInsert = Database['public']['Tables']['portfolio_items']['Insert'];
export type PortfolioItemUpdate = Database['public']['Tables']['portfolio_items']['Update'];

// Form System Enums (migration 033)
export type FormTemplateCategory = 'health' | 'consent' | 'consultation' | 'feedback' | 'custom';
export type FormSendMode = 'automatic' | 'manual';
export type FormFrequencyDb = 'every_time' | 'once';
export type FormSignatureType = 'draw' | 'type';
export type FormSubmissionStatus = 'pending' | 'in_progress' | 'completed' | 'expired';
export type FormSentVia = 'email' | 'sms' | 'in_app';
export type FormDeliveryMethodDb = 'email' | 'sms';
export type FormDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// Form System Table Types
export type FormTemplateRow = Database['public']['Tables']['form_templates']['Row'];
export type FormTemplateInsert = Database['public']['Tables']['form_templates']['Insert'];
export type FormTemplateUpdate = Database['public']['Tables']['form_templates']['Update'];

export type FormSubmissionRow = Database['public']['Tables']['form_submissions']['Row'];
export type FormSubmissionInsert = Database['public']['Tables']['form_submissions']['Insert'];
export type FormSubmissionUpdate = Database['public']['Tables']['form_submissions']['Update'];

export type FormDeliveryRow = Database['public']['Tables']['form_deliveries']['Row'];
export type FormDeliveryInsert = Database['public']['Tables']['form_deliveries']['Insert'];
export type FormDeliveryUpdate = Database['public']['Tables']['form_deliveries']['Update'];
