// supabase/schema.sql に対応する型定義。

export type Stage = "group" | "semifinal" | "final" | "third_place" | "replay";
export type MatchStatus = "scheduled" | "completed" | "draw_replay_needed" | "postponed";
export type EventType = "goal" | "assist" | "yellow_card" | "red_card";
export type SuspensionReason = "yellow_accumulation" | "red_card";

export type Team = {
  id: string;
  name: string;
  display_order: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  stage: Stage;
  round_name: string | null;
  match_datetime: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  parent_match_id: string | null;
  replay_of_match_id: string | null;
  winner_team_id: string | null;
  loser_team_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchEvent = {
  id: string;
  match_id: string;
  team_id: string;
  player_name: string;
  event_type: EventType;
  minute: number | null;
  related_goal_event_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Suspension = {
  id: string;
  player_name: string;
  team_id: string;
  reason: SuspensionReason;
  source_match_id: string;
  suspension_match_id: string | null;
  is_served: boolean;
  served_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSetting = {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: Team;
        Insert: {
          id?: string;
          name: string;
          display_order?: number;
          note?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          display_order?: number;
          note?: string | null;
        };
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: {
          id?: string;
          stage: Stage;
          round_name?: string | null;
          match_datetime?: string | null;
          home_team_id: string;
          away_team_id: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchStatus;
          parent_match_id?: string | null;
          replay_of_match_id?: string | null;
          winner_team_id?: string | null;
          loser_team_id?: string | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          stage?: Stage;
          round_name?: string | null;
          match_datetime?: string | null;
          home_team_id?: string;
          away_team_id?: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchStatus;
          parent_match_id?: string | null;
          replay_of_match_id?: string | null;
          winner_team_id?: string | null;
          loser_team_id?: string | null;
          note?: string | null;
        };
        Relationships: [];
      };
      match_events: {
        Row: MatchEvent;
        Insert: {
          id?: string;
          match_id: string;
          team_id: string;
          player_name: string;
          event_type: EventType;
          minute?: number | null;
          related_goal_event_id?: string | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          team_id?: string;
          player_name?: string;
          event_type?: EventType;
          minute?: number | null;
          related_goal_event_id?: string | null;
          note?: string | null;
        };
        Relationships: [];
      };
      suspensions: {
        Row: Suspension;
        Insert: {
          id?: string;
          player_name: string;
          team_id: string;
          reason: SuspensionReason;
          source_match_id: string;
          suspension_match_id?: string | null;
          is_served?: boolean;
          served_at?: string | null;
        };
        Update: {
          id?: string;
          player_name?: string;
          team_id?: string;
          reason?: SuspensionReason;
          source_match_id?: string;
          suspension_match_id?: string | null;
          is_served?: boolean;
          served_at?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: AppSetting;
        Insert: {
          id?: string;
          key: string;
          value: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
