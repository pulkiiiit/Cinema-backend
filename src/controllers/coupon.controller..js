import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { createCouponSchema, updateCouponSchema } from "../schema/coupon.schema.js";


// create coupon [POST]
export const createCoupon = asyncHandler(async(req, res) => {

    const data = createCouponSchema.parse(req.body);

    const coupon = await prisma.coupon.create({
        data : data
    })

    return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Created the new coupon successfully"))
    
})


// update coupon [PUT]
export const updateCoupon = asyncHandler(async(req, res) => {

    const couponId = req.params.couponId
    if(!couponId){
        throw new ApiError(400, "Send a coupon id to update")
    }

    const updatedData = updateCouponSchema.parse(req.body)

    const updatedcoupon = await prisma.coupon.update({
        where : {
            id : couponId
        },
        data : updatedData
    })

    return res
    .status(200)
    .json(new ApiResponse(200, updatedcoupon, "updated the coupon successfully"))
})


// toogle coupon status 
export const toggleCouponStatus = asyncHandler(async(req, res) => {
    const coupontId = req.params.couponId

    if(!coupontId){
        throw new ApiError(400, "Send a coupon id")
    }

    const coupon = await prisma.coupon.findUnique({
        where : {
            id : coupontId
        }
    })

    if(!coupon){
        throw new ApiError(400, "Send a valid id`")
    }

    const updatedcoupon = await prisma.coupon.update({
        where : {
            id : coupontId
        },
        data : {
            isActive: !coupon.isActive
        },
        select : {
            isActive : true
        }
    })

    return res
    .status(200)
    .json(new ApiResponse(200, updatedcoupon, `changed the coupon status to ${updatedcoupon.isActive}`))
})


// delete coupon [PATCH]
export const deleteCoupon = asyncHandler(async(req, res) => {
    const couponId = req.params.couponId

    if(!couponId){
        throw new ApiError(400 ,"Send a coupon id")
    }

    const coupon = await prisma.coupon.findUnique({
        where : {
            id : couponId
        }
    }) 

    if(!coupon){
        throw new ApiError("Send a valid Coupon id")
    }

    await prisma.coupon.delete({
        where : {
            id : couponId
        }
    })

    return res
    .status(200)
    .json(new ApiResponse(200, "Deleted the coupon Successsfully"))
})


// Get All Coupons [GET] pagination
export const getAllCoupon = asyncHandler(async(req, res) => {
    const coupons = await prisma.coupon.findMany()

    return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Fetched all the cases succesfully"))
})