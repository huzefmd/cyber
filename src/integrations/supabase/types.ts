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
      ai_recommendations: {
        Row: {
          created_at: string
          description: string
          id: string
          is_completed: boolean
          priority: Database["public"]["Enums"]["recommendation_priority"]
          scan_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_completed?: boolean
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          scan_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_completed?: boolean
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          scan_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "website_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      phishing_scans: {
        Row: {
          ai_explanation: string | null
          classification: Database["public"]["Enums"]["phishing_classification"]
          confidence_score: number | null
          created_at: string
          id: string
          provider: string | null
          recommendations: Json
          threat_indicators: Json
          url: string
          user_id: string
        }
        Insert: {
          ai_explanation?: string | null
          classification: Database["public"]["Enums"]["phishing_classification"]
          confidence_score?: number | null
          created_at?: string
          id?: string
          provider?: string | null
          recommendations?: Json
          threat_indicators?: Json
          url: string
          user_id: string
        }
        Update: {
          ai_explanation?: string | null
          classification?: Database["public"]["Enums"]["phishing_classification"]
          confidence_score?: number | null
          created_at?: string
          id?: string
          provider?: string | null
          recommendations?: Json
          threat_indicators?: Json
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      saved_websites: {
        Row: {
          created_at: string
          domain: string
          id: string
          last_scan_id: string | null
          monitoring_enabled: boolean
          name: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          last_scan_id?: string | null
          monitoring_enabled?: boolean
          name: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          last_scan_id?: string | null
          monitoring_enabled?: boolean
          name?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_websites_last_scan_fk"
            columns: ["last_scan_id"]
            isOneToOne: false
            referencedRelation: "website_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json
          scan_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message: string
          metadata?: Json
          scan_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json
          scan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "website_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      security_findings: {
        Row: {
          category: string
          created_at: string
          description: string
          evidence: string | null
          id: string
          recommendation: string | null
          scan_id: string
          severity: Database["public"]["Enums"]["finding_severity"]
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          evidence?: string | null
          id?: string
          recommendation?: string | null
          scan_id: string
          severity: Database["public"]["Enums"]["finding_severity"]
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          evidence?: string | null
          id?: string
          recommendation?: string | null
          scan_id?: string
          severity?: Database["public"]["Enums"]["finding_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "website_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      security_reports: {
        Row: {
          created_at: string
          file_size: number | null
          id: string
          report_name: string
          scan_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          id?: string
          report_name: string
          scan_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          id?: string
          report_name?: string
          scan_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "website_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      website_scans: {
        Row: {
          created_at: string
          domain: string
          id: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          saved_website_id: string | null
          scan_completed_at: string | null
          scan_started_at: string | null
          security_score: number | null
          ssl_status: string | null
          status: Database["public"]["Enums"]["scan_status"]
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          saved_website_id?: string | null
          scan_completed_at?: string | null
          scan_started_at?: string | null
          security_score?: number | null
          ssl_status?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          saved_website_id?: string | null
          scan_completed_at?: string | null
          scan_started_at?: string | null
          security_score?: number | null
          ssl_status?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_scans_saved_website_id_fkey"
            columns: ["saved_website_id"]
            isOneToOne: false
            referencedRelation: "saved_websites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
      finding_severity: "Critical" | "High" | "Medium" | "Low" | "Informational"
      phishing_classification: "Safe" | "Suspicious" | "Malicious"
      recommendation_priority: "Critical" | "High" | "Medium" | "Low"
      risk_level: "Critical" | "High" | "Medium" | "Low" | "Minimal"
      scan_status: "queued" | "running" | "completed" | "failed" | "cancelled"
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
      finding_severity: ["Critical", "High", "Medium", "Low", "Informational"],
      phishing_classification: ["Safe", "Suspicious", "Malicious"],
      recommendation_priority: ["Critical", "High", "Medium", "Low"],
      risk_level: ["Critical", "High", "Medium", "Low", "Minimal"],
      scan_status: ["queued", "running", "completed", "failed", "cancelled"],
    },
  },
} as const
