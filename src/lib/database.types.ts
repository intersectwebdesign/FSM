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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      appliances: {
        Row: {
          active: boolean
          asset_number: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          make: string | null
          model: string | null
          serial_number: string | null
          site_id: string
        }
        Insert: {
          active?: boolean
          asset_number?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          make?: string | null
          model?: string | null
          serial_number?: string | null
          site_id: string
        }
        Update: {
          active?: boolean
          asset_number?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          make?: string | null
          model?: string | null
          serial_number?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appliances_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          day_end_hour: number
          day_start_hour: number
          id: number
          maps_provider: string
          slot_minutes: number
          updated_at: string
        }
        Insert: {
          day_end_hour?: number
          day_start_hour?: number
          id?: number
          maps_provider?: string
          slot_minutes?: number
          updated_at?: string
        }
        Update: {
          day_end_hour?: number
          day_start_hour?: number
          id?: number
          maps_provider?: string
          slot_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      job_checklist_items: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_checked: boolean
          job_id: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_checked?: boolean
          job_id: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_checked?: boolean
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_checklist_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_checklist_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_expenses: {
        Row: {
          added_by: string | null
          amount: number
          category: string | null
          created_at: string
          description: string
          id: string
          job_id: string
        }
        Insert: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          job_id: string
        }
        Update: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_expenses_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_leg_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          leg_id: string
          note: string | null
          status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          leg_id: string
          note?: string | null
          status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          leg_id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_leg_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_leg_status_history_leg_id_fkey"
            columns: ["leg_id"]
            isOneToOne: false
            referencedRelation: "job_leg_costs_summary"
            referencedColumns: ["leg_id"]
          },
          {
            foreignKeyName: "job_leg_status_history_leg_id_fkey"
            columns: ["leg_id"]
            isOneToOne: false
            referencedRelation: "job_legs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_legs: {
        Row: {
          assigned_engineer_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          job_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          sequence: number
          status: string
        }
        Insert: {
          assigned_engineer_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          job_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          sequence: number
          status?: string
        }
        Update: {
          assigned_engineer_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          job_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          sequence?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_legs_assigned_engineer_id_fkey"
            columns: ["assigned_engineer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_legs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_legs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_legs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_materials: {
        Row: {
          added_by: string | null
          created_at: string
          description: string
          id: string
          job_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          description: string
          id?: string
          job_id: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Update: {
          added_by?: string | null
          created_at?: string
          description?: string
          id?: string
          job_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_materials_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          caption: string | null
          id: string
          job_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          id?: string
          job_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          id?: string
          job_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          job_id: string
          note: string | null
          status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          job_id: string
          note?: string | null
          status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          job_id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_time_entries: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          engineer_id: string
          id: string
          job_id: string
          note: string | null
          started_at: string
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          engineer_id: string
          id?: string
          job_id: string
          note?: string | null
          started_at?: string
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          engineer_id?: string
          id?: string
          job_id?: string
          note?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_time_entries_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_engineer_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          priority: string
          scheduled_end: string | null
          scheduled_start: string | null
          site_id: string
          status: string
          title: string
        }
        Insert: {
          assigned_engineer_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          priority?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          site_id: string
          status?: string
          title: string
        }
        Update: {
          assigned_engineer_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          priority?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          site_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_engineer_id_fkey"
            columns: ["assigned_engineer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      pat_tests: {
        Row: {
          appliance_id: string
          id: string
          job_id: string | null
          next_due_date: string
          notes: string | null
          result: string
          retest_months: number
          tested_at: string
          tested_by: string | null
          visual_pass: boolean
        }
        Insert: {
          appliance_id: string
          id?: string
          job_id?: string | null
          next_due_date: string
          notes?: string | null
          result: string
          retest_months?: number
          tested_at?: string
          tested_by?: string | null
          visual_pass: boolean
        }
        Update: {
          appliance_id?: string
          id?: string
          job_id?: string | null
          next_due_date?: string
          notes?: string | null
          result?: string
          retest_months?: number
          tested_at?: string
          tested_by?: string | null
          visual_pass?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pat_tests_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliance_status"
            referencedColumns: ["appliance_id"]
          },
          {
            foreignKeyName: "pat_tests_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pat_tests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "pat_tests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pat_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          hourly_rate?: number | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          access_notes: string | null
          address: string
          city: string | null
          created_at: string
          customer_id: string
          id: string
          postcode: string | null
        }
        Insert: {
          access_notes?: string | null
          address: string
          city?: string | null
          created_at?: string
          customer_id: string
          id?: string
          postcode?: string | null
        }
        Update: {
          access_notes?: string | null
          address?: string
          city?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          postcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      appliance_status: {
        Row: {
          active: boolean | null
          appliance_id: string | null
          asset_number: string | null
          description: string | null
          last_result: string | null
          last_test_id: string | null
          last_tested_at: string | null
          location: string | null
          next_due_date: string | null
          overdue: boolean | null
          site_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appliances_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      job_costs_summary: {
        Row: {
          arrived_at: string | null
          expenses_cost: number | null
          job_id: string | null
          labour_cost: number | null
          labour_minutes: number | null
          materials_cost: number | null
          total_cost: number | null
          travel_minutes: number | null
          travel_started_at: string | null
        }
        Relationships: []
      }
      job_leg_costs_summary: {
        Row: {
          arrived_at: string | null
          completed_at: string | null
          job_id: string | null
          labour_cost: number | null
          labour_minutes: number | null
          leg_id: string | null
          travel_minutes: number | null
          travel_started_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_legs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_costs_summary"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_legs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
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
