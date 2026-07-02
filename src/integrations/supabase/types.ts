export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          assigned_employee_id: string | null
          booking_date: string
          booking_time: string
          client_email: string | null
          client_id: string | null
          client_name: string
          confirmation_code: string | null
          created_at: string
          decline_reason: string | null
          deposit_amount: number | null
          duration_minutes: number
          id: string
          notes: string | null
          payment_environment: string
          payment_status: string
          platform_fee_amount: number | null
          refund_id: string | null
          service: string
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_employee_id?: string | null
          booking_date: string
          booking_time: string
          client_email?: string | null
          client_id?: string | null
          client_name: string
          confirmation_code?: string | null
          created_at?: string
          decline_reason?: string | null
          deposit_amount?: number | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          payment_environment?: string
          payment_status?: string
          platform_fee_amount?: number | null
          refund_id?: string | null
          service: string
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_employee_id?: string | null
          booking_date?: string
          booking_time?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          confirmation_code?: string | null
          created_at?: string
          decline_reason?: string | null
          deposit_amount?: number | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          payment_environment?: string
          payment_status?: string
          platform_fee_amount?: number | null
          refund_id?: string | null
          service?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          accent_color: string
          allow_same_day: boolean
          auto_confirm: boolean
          buffer_minutes: number
          business_address: string | null
          business_category: string | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          cancellation_hours: number
          company_code: string | null
          created_at: string
          currency: string
          day_end_hour: number
          day_start_hour: number
          deposit_amount: number
          id: string
          max_advance_days: number
          notify_client_confirmation: boolean
          notify_client_reminder: boolean
          notify_daily_summary: boolean
          notify_new_booking: boolean
          onboarding_completed_at: string | null
          platform_fee_percent: number
          reception_checkin_enabled: boolean
          require_deposit: boolean
          self_checkin_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
          welcome_message: string | null
          working_hours: Json
        }
        Insert: {
          accent_color?: string
          allow_same_day?: boolean
          auto_confirm?: boolean
          buffer_minutes?: number
          business_address?: string | null
          business_category?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          cancellation_hours?: number
          company_code?: string | null
          created_at?: string
          currency?: string
          day_end_hour?: number
          day_start_hour?: number
          deposit_amount?: number
          id?: string
          max_advance_days?: number
          notify_client_confirmation?: boolean
          notify_client_reminder?: boolean
          notify_daily_summary?: boolean
          notify_new_booking?: boolean
          onboarding_completed_at?: string | null
          platform_fee_percent?: number
          reception_checkin_enabled?: boolean
          require_deposit?: boolean
          self_checkin_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          welcome_message?: string | null
          working_hours?: Json
        }
        Update: {
          accent_color?: string
          allow_same_day?: boolean
          auto_confirm?: boolean
          buffer_minutes?: number
          business_address?: string | null
          business_category?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          cancellation_hours?: number
          company_code?: string | null
          created_at?: string
          currency?: string
          day_end_hour?: number
          day_start_hour?: number
          deposit_amount?: number
          id?: string
          max_advance_days?: number
          notify_client_confirmation?: boolean
          notify_client_reminder?: boolean
          notify_daily_summary?: boolean
          notify_new_booking?: boolean
          onboarding_completed_at?: string | null
          platform_fee_percent?: number
          reception_checkin_enabled?: boolean
          require_deposit?: boolean
          self_checkin_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
          working_hours?: Json
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_roles: {
        Row: {
          can_approve_requests: boolean
          can_check_in: boolean
          can_manage_settings: boolean
          can_view_all_bookings: boolean
          created_at: string
          id: string
          is_builtin: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve_requests?: boolean
          can_check_in?: boolean
          can_manage_settings?: boolean
          can_view_all_bookings?: boolean
          created_at?: string
          id?: string
          is_builtin?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve_requests?: boolean
          can_check_in?: boolean
          can_manage_settings?: boolean
          can_view_all_bookings?: boolean
          created_at?: string
          id?: string
          is_builtin?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connect_accounts: {
        Row: {
          charges_enabled: boolean
          country: string | null
          created_at: string
          default_currency: string | null
          details_submitted: boolean
          environment: string
          id: string
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          default_currency?: string | null
          details_submitted?: boolean
          environment?: string
          id?: string
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          default_currency?: string | null
          details_submitted?: boolean
          environment?: string
          id?: string
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      date_overrides: {
        Row: {
          close_time: string | null
          closed: boolean
          created_at: string
          id: string
          open_time: string | null
          override_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          close_time?: string | null
          closed?: boolean
          created_at?: string
          id?: string
          open_time?: string | null
          override_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          close_time?: string | null
          closed?: boolean
          created_at?: string
          id?: string
          open_time?: string | null
          override_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      embed_assistant_usage: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_join_requests: {
        Row: {
          assigned_role_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decline_reason: string | null
          id: string
          requester_auth_id: string
          requester_email: string
          requester_name: string
          requester_phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_role_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          requester_auth_id: string
          requester_email: string
          requester_name: string
          requester_phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_role_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          requester_auth_id?: string
          requester_email?: string
          requester_name?: string
          requester_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_join_requests_assigned_role_id_fkey"
            columns: ["assigned_role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shifts: {
        Row: {
          created_at: string
          employee_id: string
          end_time: string
          id: string
          shift_date: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_time?: string
          id?: string
          shift_date: string
          start_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_time?: string
          id?: string
          shift_date?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          auth_user_id: string | null
          available_now: boolean
          created_at: string
          email: string
          id: string
          manual_status: string | null
          manual_status_date: string | null
          name: string
          phone: string | null
          position: string | null
          role_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          available_now?: boolean
          created_at?: string
          email: string
          id?: string
          manual_status?: string | null
          manual_status_date?: string | null
          name: string
          phone?: string | null
          position?: string | null
          role_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_user_id?: string | null
          available_now?: boolean
          created_at?: string
          email?: string
          id?: string
          manual_status?: string | null
          manual_status_date?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          tier: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          tier: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          tier?: string
        }
        Relationships: []
      }
      pending_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          charge_error: string | null
          client_email: string
          client_name: string
          created_at: string
          currency: string
          decline_reason: string | null
          deposit_amount: number
          duration_minutes: number
          expires_at: string
          id: string
          notes: string | null
          payment_environment: string
          platform_fee_amount: number
          service: string
          status: string
          stripe_account_id: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          charge_error?: string | null
          client_email: string
          client_name: string
          created_at?: string
          currency?: string
          decline_reason?: string | null
          deposit_amount: number
          duration_minutes?: number
          expires_at?: string
          id?: string
          notes?: string | null
          payment_environment?: string
          platform_fee_amount: number
          service: string
          status?: string
          stripe_account_id: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          charge_error?: string | null
          client_email?: string
          client_name?: string
          created_at?: string
          currency?: string
          decline_reason?: string | null
          deposit_amount?: number
          duration_minutes?: number
          expires_at?: string
          id?: string
          notes?: string | null
          payment_environment?: string
          platform_fee_amount?: number
          service?: string
          status?: string
          stripe_account_id?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          email: string
          id: string
          price_id: string | null
          retention_offer_used: boolean
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          email: string
          id?: string
          price_id?: string | null
          retention_offer_used?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          email?: string
          id?: string
          price_id?: string | null
          retention_offer_used?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_in_by_code: {
        Args: { p_company_code: string; p_confirmation_code: string }
        Returns: {
          booking_id: string
          booking_time: string
          client_name: string
          service: string
          status: string
        }[]
      }
      claim_employee_seat: {
        Args: { p_company_code: string }
        Returns: {
          business_name: string
          business_user_id: string
          employee_id: string
        }[]
      }
      decide_join_request: {
        Args: {
          p_decision: string
          p_decline_reason: string
          p_request_id: string
          p_role_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_booking_code: { Args: never; Returns: string }
      generate_company_code: { Args: never; Returns: string }
      generate_gift_code: { Args: never; Returns: string }
      get_active_tier: { Args: { _user_id: string }; Returns: string }
      get_busy_slots: {
        Args: { p_from: string; p_to: string; p_user_id: string }
        Returns: {
          booking_date: string
          booking_time: string
          duration_minutes: number
          status: string
        }[]
      }
      get_owner_email: { Args: { _user_id: string }; Returns: string }
      get_public_business_info: {
        Args: { _user_id: string }
        Returns: {
          accent_color: string
          business_address: string
          business_category: string
          business_name: string
          business_phone: string
          cancellation_hours: number
          welcome_message: string
        }[]
      }
      get_widget_date_overrides: {
        Args: { p_from: string; p_to: string; p_user_id: string }
        Returns: {
          close_time: string
          closed: boolean
          open_time: string
          override_date: string
        }[]
      }
      get_widget_settings: {
        Args: { p_user_id: string }
        Returns: {
          accent_color: string
          allow_same_day: boolean
          buffer_minutes: number
          business_name: string
          currency: string
          deposit_amount: number
          max_advance_days: number
          timezone: string
          user_id: string
          welcome_message: string
          working_hours: Json
        }[]
      }
      has_company_permission: {
        Args: { _auth_uid: string; _business_user_id: string; _perm: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_business_by_code: {
        Args: { p_code: string }
        Returns: {
          business_name: string
          company_code: string
          user_id: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_gift_code: {
        Args: { p_code: string }
        Returns: {
          out_period_end: string
          out_tier: string
        }[]
      }
      request_to_join_company: {
        Args: { p_company_code: string; p_name: string; p_phone: string }
        Returns: {
          business_name: string
          request_id: string
        }[]
      }
      tier_booking_limit: { Args: { _tier: string }; Returns: number }
      tier_staff_limit: { Args: { _tier: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
