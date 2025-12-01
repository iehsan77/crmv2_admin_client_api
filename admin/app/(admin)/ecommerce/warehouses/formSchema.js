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
      message:
        "Only alphabets, numbers, and hyphens are allowed for this field",
    }),
  address: z
    .string()
    .min(5, "Address is too short")
    .max(100, "Address is too long")
    .regex(/^[a-zA-Z0-9\s.,#-]+$/, "Invalid address format"),
  contact_person: z
    .string()
    .min(1, { message: "Contact person name required" }),
  contact_number: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid contact number"),
  contact_email: z.string().email({ message: "Invalid email address" }),
  working_hours: z
    .string()
    .regex(/^(24\/7|\d{1,2}:\d{2} [APM]{2} - \d{1,2}:\d{2} [APM]{2})$/, {
      message:
        "Invalid working hours format. Use '8:00 AM - 6:00 PM' or '24/7'",
    }),
  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});