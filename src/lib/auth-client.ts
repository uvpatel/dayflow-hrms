import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  // Dayflow serves the UI and Better Auth from the same Next.js origin.
  // Let the browser resolve /api/auth on its current origin so local,
  // preview, and production deployments cannot accidentally call each other.
  plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
