import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";



//get cart but user id
// post cart item and create cart if doen't exits
// update cart item qunatity 
// delete cart item quantity
// Delete intire cart 
// cart validation 
// apply coupon
// Delete coupon 
// Experimental will work on it later (Cart merge) merging cart when user is not logged in