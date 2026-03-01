import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { userAddressSchema } from "../schema/order.schema.js";

// create order [POST]
export const createOrder = asyncHandler(async (req, res) => {
  // get user id from the middle ware
  // get cart usign the user id
  // validate the cart
  // if validated :create the final amount for the DB :  create order : with pending status in payment and order Status
  // send an appropriate response

  const userId = req.user.id;

  const address = userAddressSchema.parse(req.body.shippingAddress);

  const cart = await prisma.cart.findUnique({
    where: {
      userId: userId,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      coupon: true,
    },
  });

  if (!cart) {
    throw new ApiError(400, "User's Cart does not exist");
  }

  if (cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty ");
  }

  let subTotal = 0;

  for (const item of cart.items) {
    const variant = item.variant;

    if (!variant) {
      throw new ApiError(400, "variant does not exist");
    }

    if (!variant.isActive) {
      throw new ApiError(400, "Variant is not active");
    }

    if (item.quantity > variant.stock) {
      throw new ApiError(400, "Product is no longer available");
    }
    subTotal += variant.price * item.quantity;
  }

  let discount = 0;

  if (cart.coupon) {
    const coupon = cart.coupon;

    if (!coupon.isActive) {
      throw new ApiError(400, "This coupon is not Active ");
    }

    if (coupon.expiryDate < new Date()) {
      throw new ApiError(400, "Coupon is expiered");
    }

    if (coupon.minimumCartAmount && subTotal < coupon.minimumCartAmount) {
      throw new ApiError(400, "Items does not add up to the minimum cart");
    }
    if (coupon.type === "FLAT") {
      discount = coupon.value;
    }
    if (coupon.type === "PERCENTAGE") {
      discount = (subTotal * coupon.value) / 100;
    }
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }

    discount = Math.min(discount, subTotal);
  }

  const total = Math.max(subTotal - discount, 0);

  const orderItemsData = cart.items.map((item) => ({
    variantId: item.variant.id,
    quantity: item.quantity,
    priceAtPurchase: item.variant.price,
    itemTotal: item.variant.price * item.quantity,
    productName: item.variant.product.name,
    color: item.variant.color,
    size: item.variant.size,
    imageUrl: item.variant.imageUrl,
  }));

  const order = await prisma.order.create({
    data: {
      subTotal: subTotal,
      discount: discount,
      orderValue: total,
      shippingAddress: address,
      paymentStatus: "UNPAID",
      orderStatus: "PENDING",
      userId: userId,
      items: {
        create: orderItemsData,
      },
      couponUsage: cart.coupon
        ? { connect: { id: cart.coupon.id } }
        : undefined,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Created the order successfully"));
});

// User Order History [GET],Pagination
export const getUserOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const order = await prisma.order.findMany({
    where: {
      userId: userId,
    },
    include: {
      items: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Fetched the user order Succsessfully"));
});

// Get single order By ID [GET]
export const getOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
      payment: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found send a valid order id");
  }

  if (order.userId !== req.user.id) {
    throw new ApiError(403, "Unauthorized access");
  }

  return res.status(200).json(new ApiResponse(200, order, "Fetched the order"));
});

// cancel order but order id [Patch] restore the stock and coupon
export const cancelOrder = asyncHandler(async (req, res) => {
  // get order id from the params
  // validate if order exists
  // then check

  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
      couponUsage: true,
    },
  });

  if (!order) {
    throw new ApiError(400, "Order does not exist send a valid order id");
  }

  if (order.userId !== req.user.id) {
    throw new ApiError(403, "Unauthorized");
  }

  if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
    throw new ApiError(400, "Order cannot be cancelled");
  }

  await prisma.$transaction(async (tx) => {
    if (order.paymentStatus === "PAID") {
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "CANCELLED",
          paymentStatus: "REFUND_PENDING",
        },
      });

      for (const item of order.items) {
        await tx.variant.update({
          where: {
            id: item.variantId,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    } else {
      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          orderStatus: "CANCELLED",
          paymentStatus: "UNPAID",
        },
      });
    }

    if (order.couponUsage) {
      await tx.couponUsage.update({
        where: { id: order.couponUsage.id },
        data: {
          usedCount: { decrement: 1 },
        },
      });
    }
  });

  const CancelledOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, CancelledOrder, "Cancelled your order successfully")
    );
});

// List all the orders for admin [GET]
export const listOfAllOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findUnique();

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Fetched all the orders"));
});

// admin viewing the order details by id [GET]
export const getOrderDetails = asyncHandler(async (req, res) => {});

//  admin updating the order status manually [PATCH]
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = req.params.orderId;

  const newOrderStatus = req.body.updatedStatus;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });
  
  if (!order) {
    throw new ApiError(
      400,
      "Cannot find the order your order ID might be wrong please check it out"
    );
  }
  const updatedOrderStatus = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      orderStatus: newOrderStatus,
    },
    select: {
      id: true,
      orderStatus: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedOrderStatus, "Updated the order response")
    );
});
