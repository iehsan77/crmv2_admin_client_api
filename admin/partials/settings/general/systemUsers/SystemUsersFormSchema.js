import { z } from "zod";

// Helper: dropdown schema
const dropdownSchema = z.object({
  label: z.string().min(1, { message: "Required" }),
  value: z.string().min(1, { message: "Required" }),
});

export const SystemUsersFormSchema = z
  .object({
    id: z.number().default(0),
    name: z
      .string()
      .min(1, { message: "required" })
      .regex(/^[a-zA-Z\s'-]+$/, {
        message: "Only letters, spaces, hyphens and apostrophes allowed",
      }),
    last_name: z
      .string()
      .min(1, { message: "required" })
      .regex(/^[a-zA-Z\s'-]+$/, {
        message: "Only letters, spaces, hyphens and apostrophes allowed",
      }),
    email: z.string().email({ message: "Invalid email address" }),

    password: z.string().optional(), // Make optional here
    confirm_password: z.string().optional(), // Make optional here

    role_id: z.number().default(0),
    role: dropdownSchema,

    profile_id: z.number().default(0),
    profile: dropdownSchema,

    sort_by: z.union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val) || 0 : val))
      .default(0),

    active: dropdownSchema,
  })
  .superRefine((data, ctx) => {
    const isEdit = data.id !== 0;
    const passwordProvided = !!data.password?.trim();

    // If adding (id = 0) or editing with password
    if (!isEdit || passwordProvided) {
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({
          path: ["password"],
          code: "custom",
          message: "Password must be at least 6 characters",
        });
      }

      if (!data.confirm_password || data.confirm_password.length < 6) {
        ctx.addIssue({
          path: ["confirm_password"],
          code: "custom",
          message: "Confirm your password",
        });
      }

      if (data.password !== data.confirm_password) {
        ctx.addIssue({
          path: ["confirm_password"],
          code: "custom",
          message: "Passwords do not match",
        });
      }
    }
  });
