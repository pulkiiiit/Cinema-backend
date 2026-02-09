import {z} from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().optional(),
    address: z.string().optional()
})