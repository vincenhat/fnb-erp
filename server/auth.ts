import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import type { SystemRole } from '@prisma/client';

export interface AuthContext {
  userId: string;
  clerkId: string;
  organizationId: string | null;
  branchId: string | null;
  role: SystemRole | null;
}

/**
 * Resolve the current Clerk user into our domain auth context.
 * Returns null if the user is not signed in or has no profile in our DB yet.
 *
 * The Clerk webhook is responsible for upserting User + UserOrganization rows
 * (see app/api/webhooks/clerk/route.ts). Until that fires for a brand-new
 * sign-up, the user will be authenticated by Clerk but unknown to our DB.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      organizations: { take: 1, orderBy: { createdAt: 'asc' } },
      branches: { take: 1, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!user) return null;

  const orgMembership = user.organizations[0] ?? null;
  const branchMembership = user.branches[0] ?? null;

  return {
    userId: user.id,
    clerkId,
    organizationId: orgMembership?.organizationId ?? null,
    branchId: branchMembership?.branchId ?? null,
    role: orgMembership?.role ?? branchMembership?.role ?? null,
  };
}

export { currentUser };
