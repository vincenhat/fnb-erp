import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const orgRouter = router({
  /** Return the active organization for the current user. */
  current: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.organization.findUniqueOrThrow({
      where: { id: ctx.auth.organizationId },
    });
  }),

  /** List organizations this user belongs to. */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.organization.findMany({
      where: {
        users: { some: { userId: ctx.auth.userId } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120).optional(),
        taxCode: z.string().max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: enforce CASL "manage Organization" ability
      return ctx.db.organization.update({
        where: { id: ctx.auth.organizationId },
        data: input,
      });
    }),
});
