import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

const journalLineInputSchema = z
  .object({
    accountId: z.string().min(1),
    debitCents: z.bigint().nonnegative().default(0n),
    creditCents: z.bigint().nonnegative().default(0n),
    description: z.string().max(255).optional(),
  })
  .refine(
    (line) => line.debitCents > 0n !== line.creditCents > 0n,
    'Each line must have exactly one of debitCents or creditCents > 0',
  );

export const journalRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          take: z.number().int().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.journalEntry.findMany({
        where: {
          organizationId: ctx.auth.organizationId,
          ...(input?.from || input?.to
            ? {
                postedAt: {
                  ...(input?.from ? { gte: input.from } : {}),
                  ...(input?.to ? { lte: input.to } : {}),
                },
              }
            : {}),
        },
        include: { lines: { include: { account: true } } },
        orderBy: { postedAt: 'desc' },
        take: input?.take ?? 50,
      });
    }),

  /**
   * Create a balanced journal entry. The sum of debits MUST equal the sum of
   * credits — this is enforced at the application layer here. For
   * higher-level business operations (Order, PurchaseOrder, Payroll, ...), do
   * not call this directly: use the dedicated module that knows which
   * accounts to post against.
   */
  create: protectedProcedure
    .input(
      z.object({
        postedAt: z.date(),
        reference: z.string().max(100).optional(),
        description: z.string().max(500).optional(),
        sourceType: z.string().max(50).optional(),
        sourceId: z.string().max(100).optional(),
        lines: z.array(journalLineInputSchema).min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const totalDebit = input.lines.reduce((sum, l) => sum + l.debitCents, 0n);
      const totalCredit = input.lines.reduce((sum, l) => sum + l.creditCents, 0n);

      if (totalDebit !== totalCredit) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Journal entry not balanced: debit=${totalDebit} credit=${totalCredit}`,
        });
      }

      return ctx.db.journalEntry.create({
        data: {
          organizationId: ctx.auth.organizationId,
          postedAt: input.postedAt,
          reference: input.reference,
          description: input.description,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          lines: { create: input.lines },
        },
        include: { lines: true },
      });
    }),
});
