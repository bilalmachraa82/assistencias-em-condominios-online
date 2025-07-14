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
      audit_events: {
        Row: {
          actor_id: string | null
          actor_ip: string | null
          actor_name: string
          actor_role: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          service_request_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_ip?: string | null
          actor_name: string
          actor_role: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          service_request_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_ip?: string | null
          actor_name?: string
          actor_role?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          service_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          access_instructions: string | null
          address: string | null
          admin_notes: string | null
          building_type: string | null
          cadastral_reference: string | null
          city: string | null
          construction_year: number | null
          coordinates: unknown | null
          country: string | null
          created_at: string
          emergency_contacts: Json | null
          id: string
          insurance_info: Json | null
          is_active: boolean
          name: string
          organization_id: string
          postal_code: string | null
          tax_number: string | null
          total_units: number | null
          updated_at: string
        }
        Insert: {
          access_instructions?: string | null
          address?: string | null
          admin_notes?: string | null
          building_type?: string | null
          cadastral_reference?: string | null
          city?: string | null
          construction_year?: number | null
          coordinates?: unknown | null
          country?: string | null
          created_at?: string
          emergency_contacts?: Json | null
          id?: string
          insurance_info?: Json | null
          is_active?: boolean
          name: string
          organization_id: string
          postal_code?: string | null
          tax_number?: string | null
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          access_instructions?: string | null
          address?: string | null
          admin_notes?: string | null
          building_type?: string | null
          cadastral_reference?: string | null
          city?: string | null
          construction_year?: number | null
          coordinates?: unknown | null
          country?: string | null
          created_at?: string
          emergency_contacts?: Json | null
          id?: string
          insurance_info?: Json | null
          is_active?: boolean
          name?: string
          organization_id?: string
          postal_code?: string | null
          tax_number?: string | null
          total_units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          address: string | null
          admin_notes: string | null
          certifications: string[] | null
          city: string | null
          company_name: string | null
          created_at: string
          email: string
          emergency_available: boolean | null
          hourly_rate: number | null
          id: string
          insurance_info: Json | null
          is_active: boolean
          license_number: string | null
          mobile_phone: string | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          rating: number | null
          response_time_hours: number | null
          specializations: string[] | null
          tax_number: string | null
          total_jobs_completed: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          certifications?: string[] | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          emergency_available?: boolean | null
          hourly_rate?: number | null
          id?: string
          insurance_info?: Json | null
          is_active?: boolean
          license_number?: string | null
          mobile_phone?: string | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          response_time_hours?: number | null
          specializations?: string[] | null
          tax_number?: string | null
          total_jobs_completed?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          certifications?: string[] | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          emergency_available?: boolean | null
          hourly_rate?: number | null
          id?: string
          insurance_info?: Json | null
          is_active?: boolean
          license_number?: string | null
          mobile_phone?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          response_time_hours?: number | null
          specializations?: string[] | null
          tax_number?: string | null
          total_jobs_completed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_attachments: {
        Row: {
          attachment_type: string
          category: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          metadata: Json | null
          mime_type: string | null
          service_request_id: string
          uploaded_by: string
          uploaded_role: string
        }
        Insert: {
          attachment_type?: string
          category?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          service_request_id: string
          uploaded_by: string
          uploaded_role: string
        }
        Update: {
          attachment_type?: string
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          service_request_id?: string
          uploaded_by?: string
          uploaded_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_attachments_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          color_code: string | null
          created_at: string
          description: string | null
          estimated_duration_hours: number | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          requires_access_permission: boolean | null
          requires_photo: boolean | null
          updated_at: string
          urgency_level: number
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          requires_access_permission?: boolean | null
          requires_photo?: boolean | null
          updated_at?: string
          urgency_level?: number
        }
        Update: {
          color_code?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          requires_access_permission?: boolean | null
          requires_photo?: boolean | null
          updated_at?: string
          urgency_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_communications: {
        Row: {
          author_contact: string | null
          author_name: string
          author_role: string
          created_at: string
          id: string
          is_internal: boolean | null
          is_visible_to_contractor: boolean | null
          is_visible_to_tenant: boolean | null
          message: string
          message_type: string
          metadata: Json | null
          service_request_id: string
        }
        Insert: {
          author_contact?: string | null
          author_name: string
          author_role: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          is_visible_to_contractor?: boolean | null
          is_visible_to_tenant?: boolean | null
          message: string
          message_type?: string
          metadata?: Json | null
          service_request_id: string
        }
        Update: {
          author_contact?: string | null
          author_name?: string
          author_role?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          is_visible_to_contractor?: boolean | null
          is_visible_to_tenant?: boolean | null
          message?: string
          message_type?: string
          metadata?: Json | null
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_communications_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          access_token: string
          assigned_at: string | null
          building_id: string
          category_id: string
          completed_at: string | null
          contractor_id: string | null
          created_at: string
          description: string
          estimated_duration_hours: number | null
          id: string
          location_details: string | null
          metadata: Json | null
          organization_id: string
          priority: Database["public"]["Enums"]["service_priority"]
          request_number: string
          scheduled_end: string | null
          scheduled_start: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["service_status"]
          submitted_by: string | null
          submitted_contact: string | null
          title: string
          updated_at: string
          urgency_score: number
        }
        Insert: {
          access_token: string
          assigned_at?: string | null
          building_id: string
          category_id: string
          completed_at?: string | null
          contractor_id?: string | null
          created_at?: string
          description: string
          estimated_duration_hours?: number | null
          id?: string
          location_details?: string | null
          metadata?: Json | null
          organization_id: string
          priority?: Database["public"]["Enums"]["service_priority"]
          request_number: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          submitted_by?: string | null
          submitted_contact?: string | null
          title: string
          updated_at?: string
          urgency_score?: number
        }
        Update: {
          access_token?: string
          assigned_at?: string | null
          building_id?: string
          category_id?: string
          completed_at?: string | null
          contractor_id?: string | null
          created_at?: string
          description?: string
          estimated_duration_hours?: number | null
          id?: string
          location_details?: string | null
          metadata?: Json | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["service_priority"]
          request_number?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          submitted_by?: string | null
          submitted_contact?: string | null
          title?: string
          updated_at?: string
          urgency_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: { admin_email: string }
        Returns: string
      }
      generate_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_request_number: {
        Args: { org_id: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      validate_access_token: {
        Args: { token: string }
        Returns: string
      }
    }
    Enums: {
      service_priority: "low" | "normal" | "high" | "urgent" | "emergency"
      service_status:
        | "submitted"
        | "assigned"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      service_priority: ["low", "normal", "high", "urgent", "emergency"],
      service_status: [
        "submitted",
        "assigned",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
