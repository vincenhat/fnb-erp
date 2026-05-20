import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

const accountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);

export const accountRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          type: accountTypeSchema.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.account.findMany({
        where: {
          organizationId: ctx.auth.organizationId,
          ...(input?.type ? { type: input.type } : {}),
        },
        orderBy: { code: 'asc' },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1).max(20),
        name: z.string().min(1).max(200),
        type: accountTypeSchema,
        debitNormal: z.boolean(),
        parentId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.account.create({
        data: {
          ...input,
          organizationId: ctx.auth.organizationId,
        },
      });
    }),
});
