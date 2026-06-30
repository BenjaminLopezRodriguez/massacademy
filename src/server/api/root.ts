import { communityRouter } from "@/server/api/routers/community";
import { postRouter } from "@/server/api/routers/post";
import { problemRouter } from "@/server/api/routers/problem";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  community: communityRouter,
  problem: problemRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
