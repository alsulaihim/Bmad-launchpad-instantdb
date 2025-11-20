import { init } from "@instantdb/admin";
import { schema } from "./schema";
import { logger } from "@/lib/logger";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN!;

if (!APP_ID || !ADMIN_TOKEN) {
  logger.error("InstantDB Admin configuration missing", { 
    missingAppId: !APP_ID, 
    missingAdminToken: !ADMIN_TOKEN 
  });
}

export const dbAdmin = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema,
});

export async function verifyAuthToken(token: string) {
  if (!token) return null;
  try {
    const user = await dbAdmin.auth.verifyToken(token);
    return user;
  } catch (error) {
    logger.error("Error verifying token", error);
    return null;
  }
}

