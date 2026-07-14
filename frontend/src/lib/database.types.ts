export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      drafts: {
        Row: {
          user_id: string;
          problem_id: string;
          language: 'javascript' | 'typescript' | 'python';
          code: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          problem_id: string;
          language: 'javascript' | 'typescript' | 'python';
          code: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          problem_id?: string;
          language?: 'javascript' | 'typescript' | 'python';
          code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: number;
          client_id: string;
          user_id: string;
          problem_id: string;
          language: 'javascript' | 'typescript' | 'python';
          code: string;
          verdict: 'accepted' | 'wrong-answer' | 'error' | 'timeout';
          passed: number;
          total: number;
          time_ms: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          client_id: string;
          user_id: string;
          problem_id: string;
          language: 'javascript' | 'typescript' | 'python';
          code: string;
          verdict: 'accepted' | 'wrong-answer' | 'error' | 'timeout';
          passed: number;
          total: number;
          time_ms: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          client_id?: string;
          user_id?: string;
          problem_id?: string;
          language?: 'javascript' | 'typescript' | 'python';
          code?: string;
          verdict?: 'accepted' | 'wrong-answer' | 'error' | 'timeout';
          passed?: number;
          total?: number;
          time_ms?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_solved_problems: {
        Args: { profile_id: string };
        Returns: { problem_id: string; first_solved_at: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type RemoteDraft = Database['public']['Tables']['drafts']['Row'];
export type RemoteSubmission = Database['public']['Tables']['submissions']['Row'];
export type SolvedProblem = Database['public']['Functions']['get_user_solved_problems']['Returns'][number];
