import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const branchRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.branch.findMany({
      where: { organizationId: ctx.auth.organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.branch.findFirstOrThrow({
        where: { id: input.id, organizationId: ctx.auth.organizationId },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        code: z.string().min(1).max(20),
        address: z.string().max(255).optional(),
        phone: z.string().max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: enforce CASL "create Branch" ability
      return ctx.db.branch.create({
        data: {
          ...input,
          organizationId: ctx.auth.organizationId,
        },
      });
    }),
});
