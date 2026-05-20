import 'server-only';
import { db } from '@/server/db';
import { getAuthContext, type AuthContext } from '@/server/auth';

export interface Context {
  db: typeof db;
  auth: AuthContext | null;
}

/**
 * Build the tRPC context for an incoming HTTP request. Called once per
 * request from app/api/trpc/[trpc]/route.ts.
 */
export async function createContext(): Promise<Context> {
  const auth = await getAuthContext();
  return { db, auth };
}
