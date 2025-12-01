import { z } from "zod";

export const formSchema = z.object({
  id: z.number().default(0),
  title: z
    .string()
    .min(1, { message: "Please Enter Title" })
    .regex(/^[a-zA-Z0-9\s-]+$/, {
      message: "Only alphabets, numbers, and hyphens are allowed",
    }),
  slug: z
    .string()
    .min(1, { message: "Please Enter slug" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Only alphabets, numeric and '-' are allowed for this field",
    }),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});