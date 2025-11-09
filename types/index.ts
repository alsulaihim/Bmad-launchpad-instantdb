/**
 * Global type definitions for the application
 * Centralized location for shared types, interfaces, and enums
 */

/**
 * BMAD Framework workflow stages
 */
export enum WorkflowStage {
  BRAINSTORMING = "brainstorming",
  TECH_STACK = "tech_stack",
  UI_UX = "ui_ux",
  COMPLETE = "complete",
}

/**
 * User session data structure
 */
export interface UserSession {
  id: string;
  currentStage: WorkflowStage;
  createdAt: string;
  updatedAt: string;
}

/**
 * Brainstorming stage data
 */
export interface BrainstormingData {
  projectName: string;
  projectDescription: string;
  targetAudience: string;
  coreFeatures: string[];
  businessObjectives: string[];
  constraints?: string[];
}

/**
 * Tech stack selection data
 */
export interface TechStackData {
  frontend: string[];
  backend: string[];
  database: string;
  hosting: string;
  authentication?: string;
  additionalServices?: string[];
}

/**
 * UI/UX requirements data
 */
export interface UIUXData {
  designStyle: string;
  colorScheme: string;
  targetDevices: string[];
  accessibilityRequirements: string[];
  keyInteractions: string[];
}

/**
 * Complete PRD output
 */
export interface PRDOutput {
  sessionId: string;
  brainstorming: BrainstormingData;
  techStack: TechStackData;
  uiux: UIUXData;
  generatedPRD: string;
  aiPrompt: string;
  createdAt: string;
}

/**
 * Environment variables type safety
 */
export interface EnvironmentVariables {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: "development" | "staging" | "production";
}

/**
 * API response wrapper for consistent error handling
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
}

