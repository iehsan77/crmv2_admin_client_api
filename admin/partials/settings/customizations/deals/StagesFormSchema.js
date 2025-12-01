import { z } from "zod";

export const StagesFormSchema = z.object({
  id: z.number().default(0),
title: z
  .string()
  .min(1, { message: "Please Enter Title" })
  .regex(/^[a-zA-Z0-9\s/-]+$/, {
    message: "Only alphabets, numbers, hyphens, and slashes are allowed",
  }),
  percentage: z.any().optional(),
  color: z.any().optional(),
  excerpt: z.string().optional(),
  sort_by: z.union([z.number(), z.string()]).default(0),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
