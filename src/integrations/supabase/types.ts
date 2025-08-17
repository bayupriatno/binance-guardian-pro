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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          bot_id: string | null
          condition_type: string
          created_at: string
          current_value: number | null
          enabled: boolean | null
          id: string
          message: string | null
          symbol: string | null
          target_value: number
          title: string
          triggered: boolean | null
          triggered_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          bot_id?: string | null
          condition_type: string
          created_at?: string
          current_value?: number | null
          enabled?: boolean | null
          id?: string
          message?: string | null
          symbol?: string | null
          target_value: number
          title: string
          triggered?: boolean | null
          triggered_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          bot_id?: string | null
          condition_type?: string
          created_at?: string
          current_value?: number | null
          enabled?: boolean | null
          id?: string
          message?: string | null
          symbol?: string | null
          target_value?: number
          title?: string
          triggered?: boolean | null
          triggered_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          avg_fill_price: number | null
          bot_id: string | null
          commission: number | null
          created_at: string
          executed_at: string | null
          filled_quantity: number | null
          id: string
          order_id: string | null
          price: number | null
          quantity: number
          side: string
          status: string
          stop_price: number | null
          symbol: string
          time_in_force: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_fill_price?: number | null
          bot_id?: string | null
          commission?: number | null
          created_at?: string
          executed_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_id?: string | null
          price?: number | null
          quantity: number
          side: string
          status?: string
          stop_price?: number | null
          symbol: string
          time_in_force?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_fill_price?: number | null
          bot_id?: string | null
          commission?: number | null
          created_at?: string
          executed_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_id?: string | null
          price?: number | null
          quantity?: number
          side?: string
          status?: string
          stop_price?: number | null
          symbol?: string
          time_in_force?: string | null
          type?: string
          updated_at?: string
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
          risk_tolerance: string | null
          trading_experience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          risk_tolerance?: string | null
          trading_experience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          risk_tolerance?: string | null
          trading_experience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          bot_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          pnl: number | null
          price: number
          quantity: number
          side: string
          status: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          bot_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          pnl?: number | null
          price: number
          quantity: number
          side: string
          status?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          bot_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          pnl?: number | null
          price?: number
          quantity?: number
          side?: string
          status?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "trading_bots"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_bots: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          name: string
          status: string | null
          strategy: string
          total_profit: number | null
          total_trades: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          name: string
          status?: string | null
          strategy: string
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          strategy?: string
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      trading_strategies: {
        Row: {
          active: boolean | null
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          performance: Json | null
          strategy_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          performance?: Json | null
          strategy_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          performance?: Json | null
          strategy_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
