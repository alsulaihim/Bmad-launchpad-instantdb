import { i } from "@instantdb/react";

export const schema = i.schema({
  entities: {
    profiles: i.entity({
      email: i.string().optional(),
      full_name: i.string().optional(),
      anthropic_api_key: i.string().optional(),
      created_at: i.string().optional(),
      updated_at: i.string().optional(),
    }),
    projects: i.entity({
      name: i.string(),
      description: i.string(),
      status: i.string(),
      current_stage: i.number(),
      created_at: i.string(),
      updated_at: i.string(),
    }),
    project_stages: i.entity({
      stage_number: i.number(),
      stage_name: i.string(),
      responses: i.json(),
      summary: i.string(),
      completed: i.boolean(),
      completed_at: i.string(),
      created_at: i.string(),
      updated_at: i.string(),
    }),
    claude_sessions: i.entity({
      stage_number: i.number(),
      session_data: i.json(),
      messages: i.json(),
      created_at: i.string(),
      updated_at: i.string(),
    }),
    prd_documents: i.entity({
      content: i.string(),
      format: i.string(),
      version: i.number(),
      created_at: i.string(),
      updated_at: i.string(),
    }),
  },
  links: {
    projectOwner: {
      forward: {
        on: "projects",
        has: "one",
        label: "owner",
      },
      reverse: {
        on: "profiles",
        has: "many",
        label: "projects",
      },
    },
    stageProject: {
      forward: {
        on: "project_stages",
        has: "one",
        label: "project",
      },
      reverse: {
        on: "projects",
        has: "many",
        label: "stages",
      },
    },
    sessionProject: {
      forward: {
        on: "claude_sessions",
        has: "one",
        label: "project",
      },
      reverse: {
        on: "projects",
        has: "many",
        label: "claude_sessions",
      },
    },
    prdProject: {
      forward: {
        on: "prd_documents",
        has: "one",
        label: "project",
      },
      reverse: {
        on: "projects",
        has: "many",
        label: "prds",
      },
    },
  },
});

export type Schema = typeof schema;

// Default export for InstantDB CLI
export default schema;

