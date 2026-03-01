import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})


// create payment intent [POST]
export const createPaymentOrder = asyncHandler(async(req, res) => {

    const {orderId} = req.body
    const {userId} = req.user.id

    const order = await prisma.order.findUnique({
        where : {
            id : userId
        },
    })

    if(!order){
        throw new ApiError(400, "Order not found order id might be invalid")
    }

    if(userId === order.userId){
        throw new ApiError(400, "Order is of different user")
    }

    if(order.orderStatus === "PENDING"){
        throw new ApiError(400, "order status is pending")
    }

    if (order.paymentStatus === "PAID" || "FAILED" || "REFUND_PENDING" || "REFUNDED") {
        throw new ApiError(400, "order status is not unpaid")
    }

    const orderValue = order.orderValue
    const amountInPaise = orderValue * 100 

    const options = {
        amount: amountInPaise,
        currency: order.currency,
        receipt: orderId,
        payment_capture: 1, 
    }

    const razorpayOrder = await razorpay.orders.create(options);

    await prisma.$transaction(async(tx) => {
        const payment = await tx.payment.create({
            data: {
                orderId : orderId,
                userId  : userId,
                razorpayOrderId : razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                status: razorpayOrder.status,
            }
        })
        
    })
})

// Verifying payment 
export const verifyPayment = asyncHandler(async(req, res) => {

})


// Payment Gateway webhook [POST]
export const paymenWebhook = asyncHandler(async(req, res ) => {

})


// Get payment status [GET]. 
export const getPaymentStatus = asyncHandler(async(req, res) => {

})

// G    et all payments for the admin
export const getAllPayments = asyncHandler(async(req, res) => {

})

// export payment
export const refundPayment = asyncHandler(async(req, res) => {

})