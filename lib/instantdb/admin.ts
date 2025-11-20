import { init } from "@instantdb/admin";
import { schema } from "./schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN!;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("InstantDB Admin configuration missing (APP_ID or ADMIN_TOKEN)");
}

export const dbAdmin = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema,
});

