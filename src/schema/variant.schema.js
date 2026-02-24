import {z} from "zod";

export const createVariantSchema = z.object({
    imageUrl: z.string().optional(),
    color: z.string().optional(), 
    size: z.string().optional(),
    price: z.coerce.number().int().min(0),
    stock: z.coerce.number().int().min(0),
})

export const updateVariantSchema = z.object({
    imageUrl: z.string().optional(),
    color: z.string().optional(), 
    size: z.string().optional(),
    price: z.coerce.number().int().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional(),
}) 
