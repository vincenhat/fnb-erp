import { router } from '../trpc';
import { orgRouter } from './org';
import { branchRouter } from './branch';
import { userRouter } from './user';
import { accountRouter } from './account';
import { journalRouter } from './journal';

export const appRouter = router({
  org: orgRouter,
  branch: branchRouter,
  user: userRouter,
  account: accountRouter,
  journal: journalRouter,
});

export type AppRouter = typeof appRouter;
