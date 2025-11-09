/**
 * Database type definitions for Supabase
 * Auto-generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          anthropic_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          anthropic_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          anthropic_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "in_progress" | "completed" | "archived";
          current_stage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: "in_progress" | "completed" | "archived";
          current_stage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: "in_progress" | "completed" | "archived";
          current_stage?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_stages: {
        Row: {
          id: string;
          project_id: string;
          stage_number: number;
          stage_name: string;
          responses: Json;
          summary: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_number: number;
          stage_name: string;
          responses?: Json;
          summary?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_number?: number;
          stage_name?: string;
          responses?: Json;
          summary?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      claude_sessions: {
        Row: {
          id: string;
          project_id: string;
          stage_number: number;
          session_data: Json;
          messages: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_number: number;
          session_data?: Json;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_number?: number;
          session_data?: Json;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      prd_documents: {
        Row: {
          id: string;
          project_id: string;
          content: string;
          format: "markdown" | "pdf" | "html";
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          content: string;
          format?: "markdown" | "pdf" | "html";
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          content?: string;
          format?: "markdown" | "pdf" | "html";
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

/**
 * Application-specific types
 */

export interface StageResponses {
  [questionId: string]: string | string[] | boolean | number;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SessionData {
  started_at: string;
  agent_type?: string;
  context?: Record<string, unknown>;
}

export type ProjectStatus = "in_progress" | "completed" | "archived";
export type DocumentFormat = "markdown" | "pdf" | "html";
export type StageNumber = 1 | 2 | 3;

export const STAGE_NAMES = {
  1: "Brainstorming & Requirements",
  2: "Tech Stack & Architecture",
  3: "UI/UX Design",
} as const;
