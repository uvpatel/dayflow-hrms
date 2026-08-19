export {}

// Create a type for the Roles
export type Roles = 'admin' | 'moderator'

declare module "*.css";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
  interface UserPublicMetadata {
    role?: Roles | null
  }
}