import { init } from "@instantdb/react";
import { schema } from "./schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!;

if (!APP_ID) {
  console.error("NEXT_PUBLIC_INSTANTDB_APP_ID is not defined");
}

export const db = init({
  appId: APP_ID,
  schema,
});

