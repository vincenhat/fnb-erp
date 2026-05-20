import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Procedure that requires an authenticated user with a known organization.
 * Use this for the vast majority of business endpoints.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not signed in' });
  }
  if (!ctx.auth.organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User has no organization',
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        // Narrow type — guaranteed non-null past this point.
        organizationId: ctx.auth.organizationId,
      },
    },
  });
});

export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
