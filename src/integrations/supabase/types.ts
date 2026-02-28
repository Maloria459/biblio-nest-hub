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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      book_club_events: {
        Row: {
          created_at: string
          event_date: string
          event_name: string
          id: string
          location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_name: string
          id?: string
          location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_name?: string
          id?: string
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          avis: string | null
          chapter_notes: Json | null
          chapter_notes_enabled: boolean | null
          chapters: number | null
          citations: Json | null
          coup_de_coeur: boolean | null
          cover_url: string | null
          created_at: string
          end_date: string | null
          format: string | null
          genre: string | null
          id: string
          mature_content: boolean | null
          pages: number | null
          pages_read: number | null
          passages_preferes: string | null
          personnages_preferes: string | null
          price: number | null
          publication_date: string | null
          publisher: string | null
          rating: number | null
          recommandation_du_mois: boolean | null
          recommandation_month: string | null
          series: string | null
          sort_order: number | null
          spicy_level: number | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author: string
          avis?: string | null
          chapter_notes?: Json | null
          chapter_notes_enabled?: boolean | null
          chapters?: number | null
          citations?: Json | null
          coup_de_coeur?: boolean | null
          cover_url?: string | null
          created_at?: string
          end_date?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          mature_content?: boolean | null
          pages?: number | null
          pages_read?: number | null
          passages_preferes?: string | null
          personnages_preferes?: string | null
          price?: number | null
          publication_date?: string | null
          publisher?: string | null
          rating?: number | null
          recommandation_du_mois?: boolean | null
          recommandation_month?: string | null
          series?: string | null
          sort_order?: number | null
          spicy_level?: number | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string
          avis?: string | null
          chapter_notes?: Json | null
          chapter_notes_enabled?: boolean | null
          chapters?: number | null
          citations?: Json | null
          coup_de_coeur?: boolean | null
          cover_url?: string | null
          created_at?: string
          end_date?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          mature_content?: boolean | null
          pages?: number | null
          pages_read?: number | null
          passages_preferes?: string | null
          personnages_preferes?: string | null
          price?: number | null
          publication_date?: string | null
          publisher?: string | null
          rating?: number | null
          recommandation_du_mois?: boolean | null
          recommandation_month?: string | null
          series?: string | null
          sort_order?: number | null
          spicy_level?: number | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_settings: {
        Row: {
          created_at: string
          formats: string[]
          genres: string[]
          id: string
          statuses: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          formats?: string[]
          genres?: string[]
          id?: string
          statuses?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          formats?: string[]
          genres?: string[]
          id?: string
          statuses?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      literary_events: {
        Row: {
          created_at: string
          event_date: string
          event_name: string
          id: string
          location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_name: string
          id?: string
          location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_name?: string
          id?: string
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          pseudo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string
          id?: string
          last_name?: string
          pseudo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          pseudo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string
          created_at: string
          duration_minutes: number
          id: string
          last_page_reached: number | null
          session_date: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          last_page_reached?: number | null
          session_date?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          last_page_reached?: number | null
          session_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
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
