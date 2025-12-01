import { optional, z } from "zod";

export const formSchema = z.object({
  id: z.number().default(0),
  sales_order_no: z.string().nullable().optional(),
  sales_order_id: z.union([
    z.object({
      label: z.string().min(1, { message: "Required" }),
      value: z.string().min(1, { message: "Required" }),
    }),
    z.string().nullable().optional(),
    z.number().nullable().optional(),
  ]).default(0),
  sales_person_id: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

  subject: z.string().nullable().optional(),
  //team: z.string().nullable().optional(),

  //carrier: z.string().nullable().optional(),
  carrier: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

  date: z.date(),
  due_date: z.date().nullable().optional(),

  //customer_id:z.string().optional(),
  customer_id: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

  //status: z.string().optional(),
  status: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),

  
  billing_street: z.string().nullable().optional(),
  billing_city: z.string().nullable().optional(),
  billing_state: z.string().nullable().optional(),
  billing_code: z.string().nullable().optional(),
  billing_country: z.string().nullable().optional(),

  shipping_street: z.string().nullable().optional(),
  shipping_city: z.string().nullable().optional(),
  shipping_state: z.string().nullable().optional(),
  shipping_code: z.string().nullable().optional(),
  shipping_country: z.string().nullable().optional(),


  items: z
    .array(
      z.object({
        //product_id: z.number().default(0),
        product_id: z.union([z.string(), z.number()]).default(0),
        // ✅ FIXED default value for ID
        product: z.object({
          value: z.string().min(1, { message: "Invalid category ID" }),
          label: z.string().min(1, { message: "Please Select" }),
        }),

        description: z.string().nullable().optional(),
        //quantity: z.number().min(1, { message: "Quantity must be at least 1." }).default(1),// ✅ Defaults to 1
        //quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1." }).default(1),// ✅ Defaults to 1
        quantity: z.union([
          z.string().min(0, { message: "Quantity is required." }),
          z.number().positive()
            .min(1, { message: "Quantity must be at least 1." })
            .default(1),
        ]),
        price: z.coerce.number().nonnegative().min(0, { message: "Price is required." }),
        amount: z.coerce.number().nonnegative().min(0, { message: "Amount is required." }),
        discount: z.coerce.number().min(0).optional(), // ✅ Optional
        tax: z.coerce.number().min(0).optional(), // ✅ Optional
        total: z.coerce.number().nonnegative().min(0, { message: "Total is required." }),
      })
    )
    .default([]),

  subtotal: z.string().nullable().optional(),
  discount: z.string().nullable().optional(),
  tax: z.string().nullable().nullable().optional(),
  grand_total: z.string().nullable().optional(),

  terms_conditions: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
