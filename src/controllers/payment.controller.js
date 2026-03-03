import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import API from "razorpay/dist/types/api.js";
import { promise } from "zod";
import { pick } from "zod/mini";
import { th } from "zod/locales";

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
export const paymentWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return res.status(500).json({ message: "Webhook processing failed" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invlaid webhook signature");
  }

  const event = JSON.parse(req.body.toString());

  const eventType = event.event;

  try {
    if (eventType === "payment.captured") {
      const razorpayOrderId = event.payload.payment.entity.order_id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
      });

      if (!payment) {
        return res.status(200).json({ received: true });
      }

      if (payment.status === "PAID") {
        return res.status(200).json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            paymentStatus: "PAID",
          },
        });

        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            orderStatus: "CONFIRMED",
          },
        });
      });
    }

    if (eventType === "payment.failed") {
      const razorpayOrderId = event.payload.payment.entity.order_id;

      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: { status: "FAILED" },
      });
    }

    if (eventType === "refund.processed") {
      const razorpayPaymentId = event.payload.refund.entity.payment_id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId },
      });

      if (!payment) return res.status(200).json({ received: true });

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: "REFUNDED" },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { orderStatus: "CANCELLED" },
        });
      });
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

// Get payment status [GET].
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const userid = req.user.id;
  const orderid = req.params.orderId;

  const order = await prisma.order.findUnique({
    where: {
      id: orderid,
    },
  });

  if (!order) {
    throw new ApiError(404, "Cannot find the order order id might be wrong");
  }

  const latestPayment = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestPayment) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          paymentStatus: "NOT_INITIATED",
          orderStatus: order.orderStatus,
          paymentMethod: null,
          paidAt: null,
        },
        "No payment attempts yet"
      )
    );
  }

  const resturnData = {
    paymentStatus: latestPayment.paymentStatus,
    orderStatus: order.orderStatus,
    paymentMeathos: latestPayment.paymentMethod,
    paidAt: latestPayment.createdAt,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        resturnData,
        "Here is the latest payment information about the order"
      )
    );
});

// G    et all payments for the admin
export const getAllPayments = asyncHandler(async (req, res) => {

  const userId = req.user.id

  const user = await prisma.user.findUnique({
    where : {
      id : userId
    }
  })

  if(user.role !== "ADMIN"){
    throw new ApiError(400, "unauthorized access") 
  }

  const {
    page = 1,
    limit = 10,
    status,
    sort = "desc",
    userid
  } = req.query

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  const skip = (pageNumber - 1) * pageSize;

  const where = {};

  if(status){
    where.status = status;
  }

  if(userid){
    where.userid = userid
  }

  const [payments, totalCount] = await promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take : pageSize,
      orderBy : {
        createdAt: sort === "asc" ? "asc" : "desc",
      },
    }),
    prisma.payment.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize);

  return res
  .status(200)
  .json(
    new ApiResponse(200, {
      payments,
      pagination :{
        totalRecords : totalCount,
        totalPages,
        currentPage: pageNumber,
        pageSize,
      }
    }, "Payments fetched successfully")
  )

});

// export payment(for future)
// export const refundPayment = asyncHandler(async (req, res) => {
//   const userId = req.user.id

//   const user = await prisma.user.findUnique({
//     where : {
//       id : userId
//     }
//   })

//   if(user.role !== "ADMIN"){
//     throw new ApiError(400 , "Unauthorized Access")
//   }

//   const {razorpayPaymentId} = req.body;

//   if (!razorpayPaymentId) {
//     throw new ApiError(400, "RazorPay payment id is requried")
//   }

//   const payment = await prisma.payment.findUnique({
//     where : {
//       razorpayPaymentId  : razorpayPaymentId 
//     }
//   })

//   if (!payment) {
//     throw new ApiError(404, "payment not found razor pay payment id might be wrong")
//   }

//   if(payment.paymentStatus === "PAID"){
//     const refund = await razorpay.payments.refund(razorpayPaymentId);

//     await prisma.$transaction( async(tx) => {

//     })

//   }




// });
