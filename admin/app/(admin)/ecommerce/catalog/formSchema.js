import { optional, z } from "zod";

export const formSchema = z.object({
  id: z.number().default(0),
  title: z
    .string()
    .min(1, { message: "Please enter a title" })
    .regex(/^[a-zA-Z0-9\s-]+$/, {
      message: "Only alphabets, numbers, and hyphens are allowed",
    }),
  slug: z
    .string()
    .min(1, { message: "Please enter a slug" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Only lowercase letters, numbers, and hyphens are allowed",
    }),

  category_id: z
    .union([
      z.object({
        label: z.string().min(1, { message: "Required" }),
        value: z.string().min(1, { message: "Required" }),
      }),
      z.string(), // Allow brand_id to be a simple string (like an ID)
      z.null(), // Allow brand_id to be null
    ])
    .optional(),

  model_number: z.string().optional(),
  excerpt: z.string().optional(),
  description: z.string().optional(),

  stock_qty: z.any().optional(),
  min_pruchase_qty: z.any().optional(),
  max_pruchase_qty: z.any().optional(),
  low_stock_limit: z.any().optional(),

  seo_title: z.string().optional(),
  seo_keywords: z.string().optional(),
  seo_description: z.string().optional(),

  shipping_weight: z.string().optional(),
  product_width: z.string().optional(),
  product_height: z.string().optional(),
  product_length: z.string().optional(),

  active: z.union([
    z.boolean(), // Allows true/false
    z.number().int().min(0).max(1), // Allows 0 or 1
  ]),
  //active: z.boolean(),
  //thumbnail: z.union([z.instanceof(File), z.string()]).optional(),
  old_thumbnail: z.string().optional(),
  thumbnail: z
    .union([z.instanceof(File), z.string()])
    .refine((val) => val instanceof File || typeof val === "string", {
      message: "Please select product image",
    })
    .optional(),
  cost: z.union([z.coerce.number().positive(), z.string().max(0)]).optional(),
  price: z.union([z.coerce.number().positive(), z.string().max(0)]).optional(),
  sale_price: z.union([
    z.coerce.number().positive(),
    z.string().min(1, { message: "Required" }).max(0),
  ]),


  sku: z.string().optional(),

  product_type: z
    .union([
      z.object({
        label: z.string().min(1, { message: "Required" }),
        value: z.string().min(1, { message: "Required" }),
      }),
      z.string(), // Allow brand_id to be a simple string (like an ID)
      z.null(), // Allow brand_id to be null
    ])
    .optional(),

  tag_ids: z
    .union([
      z.array(
        z.object({
          label: z.string().min(1, { message: "Required" }),
          value: z.string().min(1, { message: "Required" }),
        })
      ), // Array of objects
      z.object({
        label: z.string().min(1, { message: "Required" }),
        value: z.string().min(1, { message: "Required" }),
      }), // Single object
      z.string(), // Single ID as a string
      z.number(),
      z.null(), // Allow null
    ])
    .optional(),

  brand_id: z
    .union([
      z.object({
        label: z.string().min(1, { message: "Required" }),
        value: z.string().min(1, { message: "Required" }),
      }),
      z.string(), // Allow brand_id to be a simple string (like an ID)
      z.number(),
      z.null(), // Allow brand_id to be null
    ])
    .optional(),
  stock_location_id: z
    .union([
      z.object({
        label: z.string().min(1, { message: "Required" }),
        value: z.string().min(1, { message: "Required" }),
      }),
      z.string(), // Allow brand_id to be a simple string (like an ID)
      z.number(),
      z.null(), // Allow brand_id to be null
    ])
    .optional(),
  //is_returnable: z.boolean(),
  is_returnable: z.union([
    z.boolean(), // Allows true/false
    z.number().int().min(0).max(1), // Allows 0 or 1
  ]),
  return_policy: z.string().optional(),
});
