import { z } from "zod";

export const RolesFormSchema = z.object({
  id: z.number().default(0),
  title: z
  .string()
  .min(1, { message: "Please Enter Title" })
  .regex(/^[a-zA-Z0-9\s-]+$/, {
    message: "Only alphabets, numbers, and hyphens are allowed",
  }),
  report_to_id: z.number().default(0),
  report_to: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
  excerpt: z.string().optional(),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
