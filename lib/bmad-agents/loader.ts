/**
 * BMAD Agent Loader (Server-Only)
 * This file uses Node.js fs module and should only be imported by server-side code (API routes)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

/**
 * Load BMAD agent system prompt from file
 * @param agentType - Type of BMAD agent (analyst, architect, designer, pm, etc.)
 * @returns System prompt for the agent
 */
export async function loadBMADAgentPrompt(
  agentType: "analyst" | "architect" | "designer" | "pm" | "scrum-master" | "developer"
): Promise<string> {
  const agentFilePaths: Record<string, string> = {
    analyst: path.join(process.cwd(), 'lib/bmad-agents/analyst.md'),
    architect: path.join(process.cwd(), 'lib/bmad-agents/architect.md'),
    designer: path.join(process.cwd(), 'lib/bmad-agents/designer.md'),
  };

  // Try to load from file, fall back to basic prompts if file doesn't exist
  try {
    if (agentFilePaths[agentType]) {
      const promptContent = await fs.readFile(agentFilePaths[agentType], 'utf-8');
      return promptContent;
    }
  } catch (error) {
    logger.warn(`Failed to load BMAD agent file for ${agentType}, using fallback`, { error });
  }

  // Fallback prompts for agents without dedicated files yet
  const fallbackPrompts: Record<string, string> = {
    pm: `You are the BMAD Product Manager agent, an expert in product strategy and requirements coordination.
Your role is to:
1. Coordinate between business goals and technical implementation
2. Create product roadmaps and feature prioritization
3. Define success metrics and KPIs
4. Ensure alignment across all project stakeholders

Help the user develop a comprehensive product strategy and execution plan.`,

    "scrum-master": `You are the BMAD Scrum Master agent, an expert in agile project management.
Your role is to facilitate the development process and ensure smooth execution of the BMAD methodology.`,

    developer: `You are the BMAD Developer agent, an expert in writing clean, maintainable code.
Your role is to implement features according to specifications and best practices.`,
  };

  return fallbackPrompts[agentType] || fallbackPrompts.pm;
}
