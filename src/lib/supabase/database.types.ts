export type Database = {
  public: {
    Tables: {
      indicadores: {
        Row: {
          id: string;
          label: string;
          kind: "time" | "percent" | "integer";
          category: "atendimento" | "tickets" | "niveis" | "aging";
          direction: "up" | "down";
          meta: number | null;
          description: string | null;
          band_good: number | null;
          band_warn: number | null;
          ordem: number;
        };
        Insert: {
          id: string;
          label: string;
          kind: "time" | "percent" | "integer";
          category: "atendimento" | "tickets" | "niveis" | "aging";
          direction: "up" | "down";
          meta?: number | null;
          description?: string | null;
          band_good?: number | null;
          band_warn?: number | null;
          ordem?: number;
        };
        Update: Partial<Database["public"]["Tables"]["indicadores"]["Insert"]>;
        Relationships: [];
      };
      medicoes: {
        Row: {
          indicator_id: string;
          period: string;
          value: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          indicator_id: string;
          period: string;
          value: number;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["medicoes"]["Insert"]>;
        Relationships: [];
      };
      medicoes_auditoria: {
        Row: {
          id: string;
          indicator_id: string;
          period: string;
          value_old: number | null;
          value_new: number;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          indicator_id: string;
          period: string;
          value_old?: number | null;
          value_new: number;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["medicoes_auditoria"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Indicador = Database["public"]["Tables"]["indicadores"]["Row"];
export type Medicao = Database["public"]["Tables"]["medicoes"]["Row"];
