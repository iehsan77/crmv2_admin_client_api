import { z } from "zod";

export const formSchema = z.object({
  id: z.number().default(0),
  attribute_id: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
  title: z.string().min(1, { message: "Please Enter Value" }),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
