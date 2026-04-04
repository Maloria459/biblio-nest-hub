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
          acquired_from_wishlist: boolean | null
          author: string
          avis: string | null
          borrow_date: string | null
          borrower_name: string | null
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
          has_epilogue: boolean | null
          has_prologue: boolean | null
          id: string
          isbn: string | null
          lender_name: string | null
          loan_date: string | null
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
          reread_count: number
          return_date: string | null
          secondary_status: string | null
          series: string | null
          sort_order: number | null
          spicy_level: number | null
          start_date: string | null
          status: string
          synopsis: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_from_wishlist?: boolean | null
          author: string
          avis?: string | null
          borrow_date?: string | null
          borrower_name?: string | null
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
          has_epilogue?: boolean | null
          has_prologue?: boolean | null
          id?: string
          isbn?: string | null
          lender_name?: string | null
          loan_date?: string | null
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
          reread_count?: number
          return_date?: string | null
          secondary_status?: string | null
          series?: string | null
          sort_order?: number | null
          spicy_level?: number | null
          start_date?: string | null
          status?: string
          synopsis?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_from_wishlist?: boolean | null
          author?: string
          avis?: string | null
          borrow_date?: string | null
          borrower_name?: string | null
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
          has_epilogue?: boolean | null
          has_prologue?: boolean | null
          id?: string
          isbn?: string | null
          lender_name?: string | null
          loan_date?: string | null
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
          reread_count?: number
          return_date?: string | null
          secondary_status?: string | null
          series?: string | null
          sort_order?: number | null
          spicy_level?: number | null
          start_date?: string | null
          status?: string
          synopsis?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_tiers: {
        Row: {
          action_type: string | null
          challenge_id: string
          created_at: string
          description: string
          id: string
          name: string
          order: number
          parent_tier_id: string | null
          reward_type: string | null
          reward_value: string | null
          threshold: number
        }
        Insert: {
          action_type?: string | null
          challenge_id: string
          created_at?: string
          description: string
          id?: string
          name: string
          order?: number
          parent_tier_id?: string | null
          reward_type?: string | null
          reward_value?: string | null
          threshold?: number
        }
        Update: {
          action_type?: string | null
          challenge_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          order?: number
          parent_tier_id?: string | null
          reward_type?: string | null
          reward_value?: string | null
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_tiers_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_tiers_parent_tier_id_fkey"
            columns: ["parent_tier_id"]
            isOneToOne: false
            referencedRelation: "challenge_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          order: number
          reward_type: string
          reward_value: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          order?: number
          reward_type?: string
          reward_value?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          order?: number
          reward_type?: string
          reward_value?: string
        }
        Relationships: []
      }
      collection_books: {
        Row: {
          added_at: string
          book_id: string
          collection_id: string
          id: string
        }
        Insert: {
          added_at?: string
          book_id: string
          collection_id: string
          id?: string
        }
        Update: {
          added_at?: string
          book_id?: string
          collection_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_books_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
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
      personal_objectives: {
        Row: {
          created_at: string
          end_date: string | null
          filter_value: string | null
          id: string
          objective_type: string
          period_type: string
          pinned: boolean
          recurring: boolean
          start_date: string | null
          target_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          filter_value?: string | null
          id?: string
          objective_type: string
          period_type?: string
          pinned?: boolean
          recurring?: boolean
          start_date?: string | null
          target_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          filter_value?: string | null
          id?: string
          objective_type?: string
          period_type?: string
          pinned?: boolean
          recurring?: boolean
          start_date?: string | null
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
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
          avatar_url?: string | null
          banner_url?: string | null
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
          avatar_url?: string | null
          banner_url?: string | null
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
          reread_number: number
          session_date: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          last_page_reached?: number | null
          reread_number?: number
          session_date?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          last_page_reached?: number | null
          reread_number?: number
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          notify_community: boolean
          notify_objectives: boolean
          notify_reading_reminders: boolean
          profile_public: boolean
          show_library: boolean
          show_stats: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_community?: boolean
          notify_objectives?: boolean
          notify_reading_reminders?: boolean
          profile_public?: boolean
          show_library?: boolean
          show_stats?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_community?: boolean
          notify_objectives?: boolean
          notify_reading_reminders?: boolean
          profile_public?: boolean
          show_library?: boolean
          show_stats?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          tier_id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          tier_id: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "challenge_tiers"
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
