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
          arrived_at: string | null
          called_at: string | null
          booking_date: string
          created_at: string
          department_id: string | null
          doctor_id: string | null
          hospital_id: string | null
          id: string
          patient_name: string
          phone: string
          status: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          token_number: number
        }
        Insert: {
          arrived_at?: string | null
          called_at?: string | null
          booking_date?: string
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          patient_name: string
          phone: string
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          token_number: number
        }
        Update: {
          arrived_at?: string | null
          called_at?: string | null
          booking_date?: string
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          patient_name?: string
          phone?: string
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: string
          token_number?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      doctor_settings: {
        Row: {
          doctor_id: string
          avg_wait_minutes: number | null
          slot_minutes: number | null
          is_available: boolean | null
          start_time: string | null
          end_time: string | null
        }
        Insert: {
          doctor_id: string
          avg_wait_minutes?: number | null
          slot_minutes?: number | null
          is_available?: boolean | null
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          doctor_id?: string
          avg_wait_minutes?: number | null
          slot_minutes?: number | null
          is_available?: boolean | null
          start_time?: string | null
          end_time?: string | null
        }
        Relationships: []
      }
      doctor_schedules: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          max_per_slot: number
          schedule_date: string | null
          slot_minutes: number
          start_time: string
          weekday: number | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          max_per_slot?: number
          schedule_date?: string | null
          slot_minutes?: number
          start_time: string
          weekday?: number | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          max_per_slot?: number
          schedule_date?: string | null
          slot_minutes?: number
          start_time?: string
          weekday?: number | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          active: boolean
          created_at: string
          department_id: string | null
          fee: number | null
          hospital_id: string
          id: string
          name: string
          photo_url: string | null
          specialty: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          department_id?: string | null
          fee?: number | null
          hospital_id: string
          id?: string
          name: string
          photo_url?: string | null
          specialty?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          department_id?: string | null
          fee?: number | null
          hospital_id?: string
          id?: string
          name?: string
          photo_url?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          address: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      patient_files: {
        Row: {
          booking_id: string | null
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          notes: string | null
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          booking_id?: string | null
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          booking_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          id: string
          name_last_seen: string | null
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_last_seen?: string | null
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          name_last_seen?: string | null
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_token: { Args: never; Returns: number }
      get_next_token_for_doctor: {
        Args: { p_booking_date: string; p_doctor_id: string }
        Returns: number
      }
      process_auto_no_shows: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      booking_status: "waiting" | "ready" | "in-progress" | "done" | "no-show"
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
      booking_status: ["waiting", "ready", "in-progress", "done", "no-show"],
    },
  },
} as const
