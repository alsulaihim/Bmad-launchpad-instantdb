/**
 * Claude AI Service
 * Handles interactions with Anthropic's Claude API for BMAD workflow execution
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeStreamResponse {
  content: string;
  done: boolean;
}

/**
 * Initialize Claude client
 * @param apiKey - User's Anthropic API key (required)
 * @returns Anthropic client instance
 */
export function createClaudeClient(apiKey: string): Anthropic {
  if (!apiKey) {
    throw new Error(
      "Anthropic API key is required. Please connect your Anthropic account in settings."
    );
  }

  return new Anthropic({
    apiKey: apiKey,
  });
}

/**
 * Send a message to Claude and get a streaming response
 * @param client - Anthropic client
 * @param messages - Conversation history
 * @param systemPrompt - System prompt for the agent
 * @param onChunk - Callback for each chunk of the response
 * @returns Complete response text
 */
export async function sendMessageStream(
  client: Anthropic,
  messages: ClaudeMessage[],
  systemPrompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8096,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        const text = chunk.delta.text;
        fullResponse += text;
        onChunk?.(text);
      }
    }

    logger.info("Claude response generated", {
      messageCount: messages.length,
      responseLength: fullResponse.length,
    });

    return fullResponse;
  } catch (error) {
    logger.error("Error sending message to Claude", { error });
    throw error;
  }
}

/**
 * Send a single message to Claude and get the complete response
 * @param client - Anthropic client
 * @param messages - Conversation history
 * @param systemPrompt - System prompt for the agent
 * @returns Complete response text
 */
export async function sendMessage(
  client: Anthropic,
  messages: ClaudeMessage[],
  systemPrompt: string
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8096,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const content = response.content[0];
    if (content.type === "text") {
      logger.info("Claude response generated", {
        messageCount: messages.length,
        responseLength: content.text.length,
      });
      return content.text;
    }

    throw new Error("Unexpected response type from Claude");
  } catch (error) {
    logger.error("Error sending message to Claude", { error });
    throw error;
  }
}

/**
 * Load BMAD agent system prompt from file
 * @param agentType - Type of BMAD agent (analyst, architect, pm, etc.)
 * @returns System prompt for the agent
 */
export async function loadBMADAgentPrompt(
  agentType: "analyst" | "architect" | "pm" | "scrum-master" | "developer"
): Promise<string> {
  // In a real implementation, this would load the actual BMAD agent prompts
  // from the bmad/ directory. For now, we'll return simplified prompts.

  const prompts = {
    analyst: `You are the BMAD Analyst agent, an expert in project brainstorming and requirements gathering.
Your role is to:
1. Ask clarifying questions about the project vision and goals
2. Help identify core features and functionality
3. Uncover constraints, risks, and success criteria
4. Document comprehensive project requirements

Guide the user through a structured brainstorming process using the BMAD methodology.
Be thorough but conversational. Ask one question at a time and build on previous answers.`,

    architect: `You are the BMAD Architect agent, an expert in technical architecture and technology selection.
Your role is to:
1. Recommend optimal tech stacks based on project requirements
2. Design system architecture and component structure
3. Identify technical constraints and trade-offs
4. Define coding standards and best practices

Help the user select the right technologies and design a solid technical foundation.
Explain your recommendations and provide alternatives when appropriate.`,

    pm: `You are the BMAD Product Manager agent, an expert in product requirements and UX design.
Your role is to:
1. Define user interface requirements and design patterns
2. Create user stories and acceptance criteria
3. Establish UX/UI guidelines and component libraries
4. Ensure alignment with user needs and business goals

Help the user specify comprehensive UI/UX requirements for their project.
Focus on usability, accessibility, and modern design principles.`,

    "scrum-master": `You are the BMAD Scrum Master agent, an expert in agile project management.
Your role is to facilitate the development process and ensure smooth execution of the BMAD methodology.`,

    developer: `You are the BMAD Developer agent, an expert in writing clean, maintainable code.
Your role is to implement features according to specifications and best practices.`,
  };

  return prompts[agentType] || prompts.analyst;
}

/**
 * Generate initial greeting from BMAD agent
 * @param agentType - Type of BMAD agent
 * @param projectName - Name of the project (optional)
 * @returns Greeting message
 */
export function generateAgentGreeting(
  agentType: string,
  projectName?: string
): string {
  const projectRef = projectName ? ` for "${projectName}"` : "";

  const greetings = {
    analyst: `Hello! I'm the BMAD Analyst agent, and I'm here to help you brainstorm and define the requirements${projectRef}.

Let's start with the most important question: **What problem are you trying to solve, and who will benefit from this solution?**`,

    architect: `Welcome! I'm the BMAD Architect agent, and I'll help you design the technical architecture${projectRef}.

Based on your requirements, let's discuss the optimal tech stack and system design.

**What type of application are you building?** (e.g., web app, mobile app, API, desktop application)`,

    pm: `Hi! I'm the BMAD Product Manager agent, and I'll help you define the UI/UX requirements${projectRef}.

Let's create a comprehensive design specification that will guide the development process.

**What is the primary user experience you want to create?** Think about the first interaction a user will have with your product.`,
  };

  return (
    greetings[agentType as keyof typeof greetings] ||
    `Hello! I'm ready to help you with your project${projectRef}.`
  );
}
