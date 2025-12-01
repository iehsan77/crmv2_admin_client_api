import { z } from "zod";

export const SmsFormSchema = z.object({
  id: z.number().default(0),

  provider_name: z.string().min(1, { message: "Please Enter Title" }),
  api_url: z.string().min(1, { message: "Please Enter Title" }),
  api_key: z.string().min(1, { message: "Please Enter Title" }),
  sender_id: z.string().min(1, { message: "Please Enter Title" }),
  sender_phone: z.string().min(1, { message: "Please Enter Title" }),
  default: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
  
  sort_by: z.union([z.number(), z.string()]).default(0),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
