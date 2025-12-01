import { z } from "zod";

export const DepartmentsFormSchema = z.object({
  id: z.number().default(0),
  title: z
    .string()
    .min(1, { message: "Please Enter Title" })
    .regex(/^[a-zA-Z0-9\s-]+$/, {
      message: "Only alphabets, numbers, and hyphens are allowed",
    }),
  code: z.string().optional(),
  excerpt: z.string().optional(),
  sort_by: z.union([z.number(), z.string()]).default(0),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
