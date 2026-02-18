import {z} from "zod";

export const updateSubcategorySchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    categoryId: z.string().optional()
})