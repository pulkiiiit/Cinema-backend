import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// create payment intent [POST]
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new ApiError(400, "Order not found order id might be invalid");
  }

  if (userId !== order.userId) {
    throw new ApiError(400, "Order is of different user");
  }

  if (order.orderStatus !== "PENDING") {
    throw new ApiError(400, "order status iss pending");
  }

  if (
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "FAILED" ||
    order.paymentStatus === "REFUND_PENDING" ||
    order.paymentStatus === "REFUNDED"
  ) {
    throw new ApiError(400, "order status is not unpaid");
  }

  const orderValue = order.orderValue;
  const amountInPaise = orderValue * 100;

  const options = {
    amount: amountInPaise,
    currency: order.currency,
    receipt: orderId,
    payment_capture: 1,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  let payment;
  await prisma.$transaction(async (tx) => {
    payment = await tx.payment.create({
      data: {
        orderId: orderId,
        userId: userId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentStatus: "PENDING",
      },
    });

    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: "PENDING",
      },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Created the order successfully"));
});

// Verifying payment
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(
      400,
      "send all the required details for verifying the payment"
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      razorpayOrderId: razorpayOrderId,
    },
  });

  if (!payment) {
    throw new ApiError(
      400,
      "Payment not found payment order id might not be valid"
    );
  }

  if (payment.paymentStatus === "PAID") {
    return res
      .status(200)
      .json(new ApiResponse(200, "Your payment is verified"));
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex"); 

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Invalid paymeny signature");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: payment.orderId,
    },
  });

  if (!order) {
    throw new ApiError(
      400,
      "Data currption case order does not exist for the payment"
    );
  }

  await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
      },
    });

    const updatedOrder = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        orderStatus: "CONFIRMED",
      },
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Verified the payment successfully"));
});

// Payment Gateway webhook [POST]
export const paymenWebhook = asyncHandler(async (req, res) => {
    
});

// Get payment status [GET].
export const getPaymentStatus = asyncHandler(async (req, res) => {});

// G    et all payments for the admin
export const getAllPayments = asyncHandler(async (req, res) => {});

// export payment
export const refundPayment = asyncHandler(async (req, res) => {});
