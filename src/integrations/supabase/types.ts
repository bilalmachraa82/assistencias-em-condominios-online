export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor: string
          assistance_id: number | null
          description: string
          id: number
          timestamp: string
        }
        Insert: {
          actor: string
          assistance_id?: number | null
          description: string
          id?: number
          timestamp?: string
        }
        Update: {
          actor?: string
          assistance_id?: number | null
          description?: string
          id?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_assistance_id_fkey"
            columns: ["assistance_id"]
            isOneToOne: false
            referencedRelation: "assistances"
            referencedColumns: ["id"]
          },
        ]
      }
      assistance_messages: {
        Row: {
          assistance_id: number
          created_at: string
          id: number
          message: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          assistance_id: number
          created_at?: string
          id?: number
          message: string
          sender_name: string
          sender_role: string
        }
        Update: {
          assistance_id?: number
          created_at?: string
          id?: number
          message?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistance_messages_assistance_id_fkey"
            columns: ["assistance_id"]
            isOneToOne: false
            referencedRelation: "assistances"
            referencedColumns: ["id"]
          },
        ]
      }
      assistance_photos: {
        Row: {
          assistance_id: number
          category: string
          id: number
          photo_url: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          assistance_id: number
          category: string
          id?: number
          photo_url: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          assistance_id?: number
          category?: string
          id?: number
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistance_photos_assistance_id_fkey"
            columns: ["assistance_id"]
            isOneToOne: false
            referencedRelation: "assistances"
            referencedColumns: ["id"]
          },
        ]
      }
      assistances: {
        Row: {
          acceptance_token: string | null
          admin_alert_sent_at: string | null
          admin_notes: string | null
          alert_level: number
          building_id: number
          completion_photo_url: string | null
          created_at: string
          description: string
          id: number
          interaction_token: string
          intervention_type_id: number | null
          opened_at: string
          photo_path: string | null
          rejection_reason: string | null
          reschedule_reason: string | null
          scheduled_datetime: string | null
          scheduling_token: string | null
          status: string
          supplier_id: number
          type: string
          updated_at: string
          validation_email_sent_at: string | null
          validation_reminder_count: number
          validation_token: string | null
        }
        Insert: {
          acceptance_token?: string | null
          admin_alert_sent_at?: string | null
          admin_notes?: string | null
          alert_level?: number
          building_id: number
          completion_photo_url?: string | null
          created_at?: string
          description: string
          id?: number
          interaction_token: string
          intervention_type_id?: number | null
          opened_at?: string
          photo_path?: string | null
          rejection_reason?: string | null
          reschedule_reason?: string | null
          scheduled_datetime?: string | null
          scheduling_token?: string | null
          status?: string
          supplier_id: number
          type: string
          updated_at?: string
          validation_email_sent_at?: string | null
          validation_reminder_count?: number
          validation_token?: string | null
        }
        Update: {
          acceptance_token?: string | null
          admin_alert_sent_at?: string | null
          admin_notes?: string | null
          alert_level?: number
          building_id?: number
          completion_photo_url?: string | null
          created_at?: string
          description?: string
          id?: number
          interaction_token?: string
          intervention_type_id?: number | null
          opened_at?: string
          photo_path?: string | null
          rejection_reason?: string | null
          reschedule_reason?: string | null
          scheduled_datetime?: string | null
          scheduling_token?: string | null
          status?: string
          supplier_id?: number
          type?: string
          updated_at?: string
          validation_email_sent_at?: string | null
          validation_reminder_count?: number
          validation_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistances_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistances_intervention_type_id_fkey"
            columns: ["intervention_type_id"]
            isOneToOne: false
            referencedRelation: "intervention_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistances_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          admin_notes: string | null
          cadastral_code: string | null
          created_at: string
          id: number
          is_active: boolean
          name: string
          nif: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          cadastral_code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          nif?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          cadastral_code?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          nif?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          assistance_id: number | null
          id: number
          recipients: string | null
          sent_at: string
          success: boolean | null
          template_name: string | null
        }
        Insert: {
          assistance_id?: number | null
          id?: number
          recipients?: string | null
          sent_at?: string
          success?: boolean | null
          template_name?: string | null
        }
        Update: {
          assistance_id?: number | null
          id?: number
          recipients?: string | null
          sent_at?: string
          success?: boolean | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_assistance_id_fkey"
            columns: ["assistance_id"]
            isOneToOne: false
            referencedRelation: "assistances"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_types: {
        Row: {
          description: string | null
          id: number
          maps_to_urgency: string | null
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          maps_to_urgency?: string | null
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          maps_to_urgency?: string | null
          name?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          admin_notes: string | null
          created_at: string
          email: string
          id: number
          is_active: boolean
          name: string
          nif: string | null
          phone: string | null
          specialization: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: number
          is_active?: boolean
          name: string
          nif?: string | null
          phone?: string | null
          specialization?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: number
          is_active?: boolean
          name?: string
          nif?: string | null
          phone?: string | null
          specialization?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      valid_statuses: {
        Row: {
          created_at: string | null
          display_order: number
          hex_color: string | null
          id: number
          label_en: string | null
          label_pt: string | null
          sort_order: number
          status_value: string
        }
        Insert: {
          created_at?: string | null
          display_order: number
          hex_color?: string | null
          id?: number
          label_en?: string | null
          label_pt?: string | null
          sort_order: number
          status_value: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          hex_color?: string | null
          id?: number
          label_en?: string | null
          label_pt?: string | null
          sort_order?: number
          status_value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_sensitive_operation: {
        Args: {
          operation_type: string
          table_name: string
          record_id: number
          details?: Json
        }
        Returns: undefined
      }
      create_admin_user: {
        Args: { admin_email: string }
        Returns: string
      }
      delete_assistance_safely: {
        Args: { p_assistance_id: number }
        Returns: Json
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      update_assistance_by_token: {
        Args: {
          p_assistance_id: number
          p_token: string
          p_new_status: string
          p_scheduled_datetime?: string
          p_rejection_reason?: string
          p_reschedule_reason?: string
        }
        Returns: Json
      }
      update_assistance_status: {
        Args: {
          p_assistance_id: number
          p_new_status: string
          p_scheduled_datetime?: string
        }
        Returns: undefined
      }
      validate_supplier_token: {
        Args: { token_value: string; assistance_id: number; token_type: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
