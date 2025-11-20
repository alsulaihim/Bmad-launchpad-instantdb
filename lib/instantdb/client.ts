import { init } from "@instantdb/react";
import { schema } from "./schema";
import { logger } from "@/lib/logger";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!;

if (!APP_ID) {
  logger.error("NEXT_PUBLIC_INSTANTDB_APP_ID is not defined");
}

export const db = init({
  appId: APP_ID,
  schema,
});

