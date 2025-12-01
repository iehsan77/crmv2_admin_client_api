import { z } from "zod";

export const formSchema = z.object({
  id: z.number().default(0),
  /*
  parent_id: z
    .union([
      z.object({
        value: z.string().min(1, { message: "Invalid category ID" }),
        label: z.string().min(1, { message: "Please Select" }),
      }),
      z.string(),
      z.number().transform((val) => val.toString()), // Convert number to string
      z.null(),
    ])
    .transform((val) => {
      // If the value is an object, extract `value`
      if (typeof val === "object" && val !== null && "value" in val) {
        return val.value;
      }
      return val; // Keep string/number/null as is
    }),
 
  parent_id: z.union([
    //  z.literal(0), // Allow 0 or any positive number
    z.object({
      value: z.string().min(1, { message: "Invalid category ID" }),
      label: z.string().min(1, { message: "Please Select" }),
    }),
    z.string(),
    z.number(),
    z.null(),
  ]),
   parent_id: z.union([
  z.string(), // Accepts ID as a string
  z.number(), // Accepts ID as a number
  z.null(), // Accepts null values
  z.object({
    value: z.string().min(1, { message: "Invalid category ID" }), // Ensure value is a string
    label: z.string().min(1, { message: "Please Select" }), // Ensure label exists
  }).transform((obj) => obj.value), // Convert object to string (extract value)
]),
   */
  parent_id: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

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
  description: z.string().optional(),

  thumbnail: z.union([z.instanceof(File).optional(), z.string().optional()]),
  banner: z.union([z.instanceof(File).optional(), z.string().optional()]),
  old_thumbnail: z.string().optional(),
  old_banner: z.string().optional(),

  seo_title: z.string().optional(),
  seo_keywords: z.string().optional(),
  seo_description: z.string().optional(),

  show_in_store: z.union([z.literal(0), z.literal(1)]).default(0),
  show_in_menu: z.union([z.literal(0), z.literal(1)]).default(0),

  active: z.union([z.literal(0), z.literal(1)]).default(0),
});
