import {z} from "zod";

export const updateProductSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    SubcategoryId: z.string().optional(),
})