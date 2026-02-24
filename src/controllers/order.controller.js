import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";





// create order [POST]
// User Order History [GET],Pagination  
// Get single order By ID [GET]
// cancel order but order id [Patch] restore the stock and coupon
// List all the orders for admin [GET]
// admin viewing the order details by id [GET]
//  admin updating the order status manually [PATCH]