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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          is_read: boolean
          related_report_id: string | null
          student_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          is_read?: boolean
          related_report_id?: string | null
          student_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean
          related_report_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "lesson_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_attendance: {
        Row: {
          absence_reason: Database["public"]["Enums"]["absence_reason"] | null
          attendance_date: string
          created_at: string
          id: string
          is_present: boolean
          recorded_by: string
          student_id: string
          updated_at: string
        }
        Insert: {
          absence_reason?: Database["public"]["Enums"]["absence_reason"] | null
          attendance_date?: string
          created_at?: string
          id?: string
          is_present?: boolean
          recorded_by: string
          student_id: string
          updated_at?: string
        }
        Update: {
          absence_reason?: Database["public"]["Enums"]["absence_reason"] | null
          attendance_date?: string
          created_at?: string
          id?: string
          is_present?: boolean
          recorded_by?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exceptional_events: {
        Row: {
          created_at: string
          description: string
          followup_notes: string | null
          followup_required: boolean
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          people_involved: string | null
          reported_by: string
          staff_response: string | null
        }
        Insert: {
          created_at?: string
          description: string
          followup_notes?: string | null
          followup_required?: boolean
          id?: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          people_involved?: string | null
          reported_by: string
          staff_response?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          followup_notes?: string | null
          followup_required?: boolean
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          people_involved?: string | null
          reported_by?: string
          staff_response?: string | null
        }
        Relationships: []
      }
      lesson_reports: {
        Row: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          behavior_severity: number | null
          behavior_types: Database["public"]["Enums"]["behavior_type"][]
          comment: string | null
          created_at: string
          id: string
          lesson_subject: string
          participation:
            | Database["public"]["Enums"]["participation_level"]
            | null
          performance_score: number | null
          report_date: string
          staff_user_id: string
          student_id: string
          violence_subtypes:
            | Database["public"]["Enums"]["violence_type"][]
            | null
        }
        Insert: {
          attendance: Database["public"]["Enums"]["attendance_status"]
          behavior_severity?: number | null
          behavior_types?: Database["public"]["Enums"]["behavior_type"][]
          comment?: string | null
          created_at?: string
          id?: string
          lesson_subject: string
          participation?:
            | Database["public"]["Enums"]["participation_level"]
            | null
          performance_score?: number | null
          report_date?: string
          staff_user_id: string
          student_id: string
          violence_subtypes?:
            | Database["public"]["Enums"]["violence_type"][]
            | null
        }
        Update: {
          attendance?: Database["public"]["Enums"]["attendance_status"]
          behavior_severity?: number | null
          behavior_types?: Database["public"]["Enums"]["behavior_type"][]
          comment?: string | null
          created_at?: string
          id?: string
          lesson_subject?: string
          participation?:
            | Database["public"]["Enums"]["participation_level"]
            | null
          performance_score?: number | null
          report_date?: string
          staff_user_id?: string
          student_id?: string
          violence_subtypes?:
            | Database["public"]["Enums"]["violence_type"][]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          city: string | null
          class_name: string | null
          created_at: string
          date_of_birth: string | null
          father_email: string | null
          father_name: string | null
          father_phone: string | null
          first_name: string
          gender: string | null
          grade: string | null
          id: string
          is_active: boolean
          last_name: string
          mother_email: string | null
          mother_name: string | null
          mother_phone: string | null
          student_code: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          father_email?: string | null
          father_name?: string | null
          father_phone?: string | null
          first_name: string
          gender?: string | null
          grade?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          mother_email?: string | null
          mother_name?: string | null
          mother_phone?: string | null
          student_code: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          father_email?: string | null
          father_name?: string | null
          father_phone?: string | null
          first_name?: string
          gender?: string | null
          grade?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          mother_email?: string | null
          mother_name?: string | null
          mother_phone?: string | null
          student_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_sessions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          provider_name: string
          session_date: string
          staff_user_id: string
          student_id: string
          support_types: Database["public"]["Enums"]["support_type"][]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          provider_name: string
          session_date?: string
          staff_user_id: string
          student_id: string
          support_types?: Database["public"]["Enums"]["support_type"][]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          provider_name?: string
          session_date?: string
          staff_user_id?: string
          student_id?: string
          support_types?: Database["public"]["Enums"]["support_type"][]
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      absence_reason:
        | "illness"
        | "vacation"
        | "family_arrangements"
        | "medical_checkup"
        | "emotional_difficulty"
        | "school_suspension"
        | "other"
      app_role: "admin" | "staff"
      attendance_status: "full" | "partial" | "absent"
      behavior_type: "respectful" | "non_respectful" | "disruptive" | "violent"
      incident_type: "violence" | "bullying" | "medical" | "safety" | "other"
      participation_level:
        | "completed_tasks"
        | "active_participation"
        | "no_participation"
        | "no_function"
      support_type: "social" | "emotional" | "academic" | "behavioral"
      violence_type: "physical" | "verbal" | "property_damage" | "sexual"
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
      absence_reason: [
        "illness",
        "vacation",
        "family_arrangements",
        "medical_checkup",
        "emotional_difficulty",
        "school_suspension",
        "other",
      ],
      app_role: ["admin", "staff"],
      attendance_status: ["full", "partial", "absent"],
      behavior_type: ["respectful", "non_respectful", "disruptive", "violent"],
      incident_type: ["violence", "bullying", "medical", "safety", "other"],
      participation_level: [
        "completed_tasks",
        "active_participation",
        "no_participation",
        "no_function",
      ],
      support_type: ["social", "emotional", "academic", "behavioral"],
      violence_type: ["physical", "verbal", "property_damage", "sexual"],
    },
  },
} as const
