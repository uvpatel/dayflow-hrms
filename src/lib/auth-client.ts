import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  ...(process.env.NEXT_PUBLIC_BETTER_AUTH_URL
    ? { baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL }
    : {}),
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
