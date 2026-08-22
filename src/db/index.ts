import { neon } from "@neondatabase/serverless";
import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

export const sql = neon(databaseUrl);
export const relations = defineRelations(schema, (relation) => ({
  user: {
    sessions: relation.many.session({
      from: relation.user.id,
      to: relation.session.userId,
    }),
    accounts: relation.many.account({
      from: relation.user.id,
      to: relation.account.userId,
    }),
  },
  session: {
    user: relation.one.user({
      from: relation.session.userId,
      to: relation.user.id,
      optional: false,
    }),
  },
  account: {
    user: relation.one.user({
      from: relation.account.userId,
      to: relation.user.id,
      optional: false,
    }),
  },
}));
export const db = drizzle({ client: sql, relations });

export * from "./schema";
export { schema };
