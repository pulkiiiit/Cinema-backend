import {z} from "zod";

export const updateReviewSchema = z.object({
    rating: z.string().optional(),
    comment: z.string().min(2).optional(),
})