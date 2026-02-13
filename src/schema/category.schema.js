import {z} from "zod";

export const updateCategorySchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(), 
})