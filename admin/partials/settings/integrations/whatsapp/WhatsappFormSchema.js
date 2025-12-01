import { z } from "zod";

export const WhatsappFormSchema = z.object({
  id: z.number().default(0),

  provider_name: z.string().min(1, { message: "required" }),

  sandbox_mode: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

  api_key: z.string().min(1, { message: "required" }),
  phone_number_id: z.string().min(1, { message: "required" }),
  business_phone_number: z.string().min(1, { message: "required" }),
  webhook_url: z.string().min(1, { message: "required" }),
  webhook_verify_token: z.string().min(1, { message: "required" }),
  webhook_events: z.string().min(1, { message: "required" }),
  business_display_name: z.string().min(1, { message: "required" }),
  business_website: z.string().min(1, { message: "required" }),

});
