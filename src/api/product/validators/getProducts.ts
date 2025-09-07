import { z } from "zod";

export const getProducts = z.object({
  query: z.object({
    offset: z.string().optional(),
    limit: z.string().optional(),
  }),
});
