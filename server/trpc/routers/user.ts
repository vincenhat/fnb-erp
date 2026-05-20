import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.auth.userId },
    });
  }),

  /** List all users in the active organization. */
  listInOrg: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: {
        organizations: { some: { organizationId: ctx.auth.organizationId } },
      },
      include: {
        organizations: {
          where: { organizationId: ctx.auth.organizationId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }),
});
