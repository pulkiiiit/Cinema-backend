import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";


// create payment intent [POST]
// Payment Gateway webhook [POST]
// Get payment status [GET]