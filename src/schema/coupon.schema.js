import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(1).max(30),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  minimumCartAmount: z.coerce.number().nonnegative().optional(),
  value: z.coerce.number().positive(),
  maxDiscountAmount: z.coerce.number().positive(),
  maxUsagePerUser: z.coerce.number().int().positive(),
  expiryDate: z.iso
    .datetime() 
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: "Expiry date must be in the future",
    }),
});

export const updateCouponSchema = z.object({
  code: z.string().min(1).max(30).optional(),
  type: z.enum(["PERCENTAGE", "FLAT"]).optional(),
  minimumCartAmount: z.coerce.number().nonnegative().optional(),
  value: z.coerce.number().positive().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional(),
  maxUsagePerUser: z.coerce.number().int().positive().optional(),
  expiryDate: z.iso
    .datetime() 
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: "Expiry date must be in the future",
    }).optional(),
});