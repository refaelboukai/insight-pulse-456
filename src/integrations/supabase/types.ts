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
      absent_student_followups: {
        Row: {
          created_at: string
          home_visit: boolean
          id: string
          materials_sent: boolean
          notes: string | null
          phone_contact: boolean
          recorded_by: string
          student_id: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          home_visit?: boolean
          id?: string
          materials_sent?: boolean
          notes?: string | null
          phone_contact?: boolean
          recorded_by: string
          student_id: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          home_visit?: boolean
          id?: string
          materials_sent?: boolean
          notes?: string | null
          phone_contact?: boolean
          recorded_by?: string
          student_id?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "absent_student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          adult_contact_category: string | null
          adult_contact_name: string | null
          created_at: string
          id: string
          intensity_label: string | null
          intensity_score: number | null
          is_positive_reflection: boolean | null
          optional_context_text: string | null
          positive_source: string | null
          result_after_practice: string | null
          selected_state: string
          skill_helpful: boolean | null
          skill_used: string | null
          student_id: string
          student_name: string
          support_requested: boolean
        }
        Insert: {
          adult_contact_category?: string | null
          adult_contact_name?: string | null
          created_at?: string
          id?: string
          intensity_label?: string | null
          intensity_score?: number | null
          is_positive_reflection?: boolean | null
          optional_context_text?: string | null
          positive_source?: string | null
          result_after_practice?: string | null
          selected_state: string
          skill_helpful?: boolean | null
          skill_used?: string | null
          student_id: string
          student_name: string
          support_requested?: boolean
        }
        Update: {
          adult_contact_category?: string | null
          adult_contact_name?: string | null
          created_at?: string
          id?: string
          intensity_label?: string | null
          intensity_score?: number | null
          is_positive_reflection?: boolean | null
          optional_context_text?: string | null
          positive_source?: string | null
          result_after_practice?: string | null
          selected_state?: string
          skill_helpful?: boolean | null
          skill_used?: string | null
          student_id?: string
          student_name?: string
          support_requested?: boolean
        }
        Relationships: []
      }
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
      brain_training_history: {
        Row: {
          created_at: string
          game_type: string
          id: string
          level_at_time: number
          points_earned: number
          student_id: string | null
          student_name: string
          won: boolean
        }
        Insert: {
          created_at?: string
          game_type: string
          id?: string
          level_at_time?: number
          points_earned?: number
          student_id?: string | null
          student_name: string
          won?: boolean
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          level_at_time?: number
          points_earned?: number
          student_id?: string | null
          student_name?: string
          won?: boolean
        }
        Relationships: []
      }
      brain_training_scores: {
        Row: {
          consecutive_losses: number
          consecutive_wins: number
          created_at: string
          game_type: string
          id: string
          level: number
          max_level_reached: number
          score: number
          student_id: string | null
          student_name: string
          total_games_played: number
          updated_at: string
        }
        Insert: {
          consecutive_losses?: number
          consecutive_wins?: number
          created_at?: string
          game_type: string
          id?: string
          level?: number
          max_level_reached?: number
          score?: number
          student_id?: string | null
          student_name: string
          total_games_played?: number
          updated_at?: string
        }
        Update: {
          consecutive_losses?: number
          consecutive_wins?: number
          created_at?: string
          game_type?: string
          id?: string
          level?: number
          max_level_reached?: number
          score?: number
          student_id?: string | null
          student_name?: string
          total_games_played?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_attendance: {
        Row: {
          absence_reason: Database["public"]["Enums"]["absence_reason"] | null
          attendance_date: string
          created_at: string
          id: string
          is_present: boolean
          other_reason_text: string | null
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
          other_reason_text?: string | null
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
          other_reason_text?: string | null
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
      daily_reflections: {
        Row: {
          academic_tasks: number
          behavior: number
          class_presence: number
          created_at: string
          id: string
          social_interaction: number
          student_id: string | null
          student_name: string
        }
        Insert: {
          academic_tasks: number
          behavior: number
          class_presence: number
          created_at?: string
          id?: string
          social_interaction: number
          student_id?: string | null
          student_name?: string
        }
        Update: {
          academic_tasks?: number
          behavior?: number
          class_presence?: number
          created_at?: string
          id?: string
          social_interaction?: number
          student_id?: string | null
          student_name?: string
        }
        Relationships: []
      }
      exam_schedule: {
        Row: {
          created_at: string
          created_by: string
          exam_date: string
          exam_description: string | null
          id: string
          school_year: string
          student_id: string
          sub_subject: string | null
          subject_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          exam_date: string
          exam_description?: string | null
          id?: string
          school_year?: string
          student_id: string
          sub_subject?: string | null
          subject_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          exam_date?: string
          exam_description?: string | null
          id?: string
          school_year?: string
          student_id?: string
          sub_subject?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedule_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedule_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "managed_subjects"
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
          participation: Database["public"]["Enums"]["participation_level"][]
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
          participation?: Database["public"]["Enums"]["participation_level"][]
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
          participation?: Database["public"]["Enums"]["participation_level"][]
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
      managed_subjects: {
        Row: {
          created_at: string
          has_sub_subjects: boolean
          id: string
          is_active: boolean
          name: string
          sub_subjects: string[]
        }
        Insert: {
          created_at?: string
          has_sub_subjects?: boolean
          id?: string
          is_active?: boolean
          name: string
          sub_subjects?: string[]
        }
        Update: {
          created_at?: string
          has_sub_subjects?: boolean
          id?: string
          is_active?: boolean
          name?: string
          sub_subjects?: string[]
        }
        Relationships: []
      }
      pedagogical_goals: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_status: string | null
          id: string
          learning_goals: string | null
          learning_style: string | null
          measurement_methods: string | null
          month: string
          school_year: string
          staff_user_id: string
          student_id: string
          sub_subject: string | null
          subject_id: string
          teacher_notes: string | null
          updated_at: string
          what_was_done: string | null
          what_was_not_done: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_status?: string | null
          id?: string
          learning_goals?: string | null
          learning_style?: string | null
          measurement_methods?: string | null
          month: string
          school_year?: string
          staff_user_id: string
          student_id: string
          sub_subject?: string | null
          subject_id: string
          teacher_notes?: string | null
          updated_at?: string
          what_was_done?: string | null
          what_was_not_done?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_status?: string | null
          id?: string
          learning_goals?: string | null
          learning_style?: string | null
          measurement_methods?: string | null
          month?: string
          school_year?: string
          staff_user_id?: string
          student_id?: string
          sub_subject?: string | null
          subject_id?: string
          teacher_notes?: string | null
          updated_at?: string
          what_was_done?: string | null
          what_was_not_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedagogical_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "managed_subjects"
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
      schedule_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          day: string
          hour: string
          id: string
          is_checked: boolean
          student_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          day: string
          hour: string
          id?: string
          is_checked?: boolean
          student_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          day?: string
          hour?: string
          id?: string
          is_checked?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      student_evaluations: {
        Row: {
          behavior: string | null
          cognitive_flexibility: string | null
          created_at: string
          creative_thinking: string | null
          duties_performance: string | null
          emotional_regulation: string | null
          emotional_tools: string | null
          environmental_care: string | null
          general_functioning: string | null
          group_work: string | null
          helping_others: string | null
          id: string
          independent_work: string | null
          perseverance: string | null
          personal_note: string | null
          problem_solving: string | null
          self_efficacy: string | null
          staff_user_id: string
          student_id: string
          studentship: string | null
          updated_at: string
        }
        Insert: {
          behavior?: string | null
          cognitive_flexibility?: string | null
          created_at?: string
          creative_thinking?: string | null
          duties_performance?: string | null
          emotional_regulation?: string | null
          emotional_tools?: string | null
          environmental_care?: string | null
          general_functioning?: string | null
          group_work?: string | null
          helping_others?: string | null
          id?: string
          independent_work?: string | null
          perseverance?: string | null
          personal_note?: string | null
          problem_solving?: string | null
          self_efficacy?: string | null
          staff_user_id: string
          student_id: string
          studentship?: string | null
          updated_at?: string
        }
        Update: {
          behavior?: string | null
          cognitive_flexibility?: string | null
          created_at?: string
          creative_thinking?: string | null
          duties_performance?: string | null
          emotional_regulation?: string | null
          emotional_tools?: string | null
          environmental_care?: string | null
          general_functioning?: string | null
          group_work?: string | null
          helping_others?: string | null
          id?: string
          independent_work?: string | null
          perseverance?: string | null
          personal_note?: string | null
          problem_solving?: string | null
          self_efficacy?: string | null
          staff_user_id?: string
          student_id?: string
          studentship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          ai_enhanced_evaluation: string | null
          created_at: string
          grade: number | null
          id: string
          semester: string
          staff_user_id: string
          student_id: string
          sub_grades: Json | null
          subject: string
          updated_at: string
          verbal_evaluation: string | null
        }
        Insert: {
          ai_enhanced_evaluation?: string | null
          created_at?: string
          grade?: number | null
          id?: string
          semester?: string
          staff_user_id: string
          student_id: string
          sub_grades?: Json | null
          subject: string
          updated_at?: string
          verbal_evaluation?: string | null
        }
        Update: {
          ai_enhanced_evaluation?: string | null
          created_at?: string
          grade?: number | null
          id?: string
          semester?: string
          staff_user_id?: string
          student_id?: string
          sub_grades?: Json | null
          subject?: string
          updated_at?: string
          verbal_evaluation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_schedules: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_enabled: boolean
          schedule_data: Json
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_enabled?: boolean
          schedule_data?: Json
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_enabled?: boolean
          schedule_data?: Json
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      support_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          frequency: string
          frequency_count: number
          id: string
          is_active: boolean
          notes_for_parents: string | null
          staff_member_id: string
          student_id: string
          support_description: string | null
          support_types: Database["public"]["Enums"]["support_type"][]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          frequency?: string
          frequency_count?: number
          id?: string
          is_active?: boolean
          notes_for_parents?: string | null
          staff_member_id: string
          student_id: string
          support_description?: string | null
          support_types?: Database["public"]["Enums"]["support_type"][]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          frequency?: string
          frequency_count?: number
          id?: string
          is_active?: boolean
          notes_for_parents?: string | null
          staff_member_id?: string
          student_id?: string
          support_description?: string | null
          support_types?: Database["public"]["Enums"]["support_type"][]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_assignments_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      support_completions: {
        Row: {
          assignment_id: string
          completed_by: string
          completion_date: string
          created_at: string
          id: string
          is_completed: boolean
          notes: string | null
        }
        Insert: {
          assignment_id: string
          completed_by: string
          completion_date?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
        }
        Update: {
          assignment_id?: string
          completed_by?: string
          completion_date?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "support_assignments"
            referencedColumns: ["id"]
          },
        ]
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
        | "home_learning"
        | "hospitalization"
        | "balance_home"
        | "medical_suspension"
      app_role: "admin" | "staff" | "student"
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
        "home_learning",
        "hospitalization",
        "balance_home",
        "medical_suspension",
      ],
      app_role: ["admin", "staff", "student"],
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
