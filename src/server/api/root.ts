import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { productRouter } from "@/server/api/routers/product";
import { categoryRouter } from "@/server/api/routers/category";
import { orderRouter } from "@/server/api/routers/order";
import { enquiryRouter } from "@/server/api/routers/enquiry";
import { mediaRouter } from "@/server/api/routers/media";
import { settingsRouter } from "@/server/api/routers/settings";
import { accountRouter, checkoutRouter } from "@/server/api/routers/checkout";
import { shopRouter } from "@/server/api/routers/shop";
import { staffRouter } from "@/server/api/routers/staff";

export const appRouter = createTRPCRouter({
  product: productRouter,
  category: categoryRouter,
  order: orderRouter,
  enquiry: enquiryRouter,
  media: mediaRouter,
  settings: settingsRouter,
  shop: shopRouter,
  checkout: checkoutRouter,
  account: accountRouter,
  staff: staffRouter,
});

export type AppRouter = typeof appRouter;

/** Lets a server component call a procedure directly, with no HTTP hop. */
export const createCaller = createCallerFactory(appRouter);
