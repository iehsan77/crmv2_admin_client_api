import { z } from "zod";

export const CompaniesFormSchema = z.object({
  id: z.number().default(0),
  // General Info
  company_name: z.string().min(1, "Company name is required"),
  excerpt: z.string().optional(),

  industry: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
  company_size: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),

  logo: z.union([z.instanceof(File).optional(), z.string().optional()]),
  old_logo: z.string().optional(),

  // Address Info
  address: z.string().optional(),
  zip_code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),

  // Contact Info
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  fax: z.string().optional(),
  contact_person: z.string().optional(),

  // Other Info
  sort_by: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), { message: "Sort By must be a number" }),

  active: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});
