import { z } from "zod";

export const formSchema = z.object({
  id: z.number().default(0),
  title: z
    .string()
    .min(1, { message: "Please Enter Title" })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Only alphabets and spaces are allowed",
    }),
    input_type: z.any(),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
