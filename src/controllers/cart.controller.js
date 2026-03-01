import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { isValid } from "zod/v3";

//get cart but user id
export const getUserCart = asyncHandler(async (req, res) => {
  // 1. get userId from middleware
  // 2. find cart by userId including items + variant + product + coupon
  // 3. if no cart or no items → return empty cart response
  // 4. calculate subtotal from DB prices
  // 5. initialize discount = 0
  // 6. if cart.couponId exists:
  //       - validate coupon (active, expiry, minAmount, usage)
  //       - if valid → calculate discount
  //       - else → discount = 0
  // 7. discount = Math.min(discount, subtotal)
  // 8. total = Math.max(subtotal - discount, 0)
  // 9. totalItems = sum of quantities
  // 10. return structured response

  const userId = req.user.id;

  const cart = await prisma.cart.findUnique({
    where: {
      userId: userId,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      coupon: true,
    },
  });

  if (!cart || cart.items.length === 0) {
    // empty cart reponse
    const resData = {
      cartId: null,
      totalItems: 0,
      subTotal: 0,
      discount: 0,
      total: 0,
      currency: "INR",
      coupon: null,
      items: [],
    };
    return res
      .status(200)
      .json(new ApiResponse(200, resData, "Fetched your cart successfully"));
  }

  // calculating the total value for the total items in the cart
  const subTotal = cart.items.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );

  let discount = 0;
  let total = subTotal;

  if (cart.couponId) {
    const cartCoupon = cart.coupon;

    const now = new Date();

    if (
      !cartCoupon ||
      !cartCoupon.isActive ||
      cartCoupon.expiryDate <= now ||
      subTotal < cartCoupon.minimumCartAmount
    ) {
      await prisma.cart.update({
        where: {
          userId: userId,
        },
        data: {
          couponId: null,
        },
      });
      discount = 0;
    } else {
      if (cartCoupon.type === "FLAT") {
        discount = cartCoupon.value;
      } else {
        discount = (subTotal * cartCoupon.value) / 100;
        discount = Number(discount.toFixed(2));
      }
      if (cartCoupon.maxDiscountAmount != null) {
        discount = Math.min(discount, cartCoupon.maxDiscountAmount);
      }
      discount = Math.min(discount, subTotal);
      total = subTotal - discount;
    }
  }
  let appliedCoupon = cart.coupon;

  if (!cart.coupon) {
    appliedCoupon = null;
  }
  // details for the response data
  const responseData = {
    id: cart.id,
    totalItems: cart.items.reduce((acc, i) => acc + i.quantity, 0),
    subTotal: subTotal,
    discount: discount,
    total: total,
    currency: "INR",
    coupon: cart.coupon,
    items: cart.items,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Fetched the cart successfully"));
});

// post cart item and create cart if doen't exits
export const addItemToCart = asyncHandler(async (req, res) => {
  // get user from the middleware and variantId from the body
  // 1. validate the that variant is there in the body and then only proceed
  // 2. start a transaction and now everything will be happneing inside the transaction
  // 3. find the variant by variatn id and validate it if its active and has enough stock to fullfil the order quantity including the current cart items
  // 4. find the cart by userId
  // 5. if no cart → create cart and add item to cartitems and send the response with proper cart items included
  // 6. if cart exists → check if item with the same variantId exists in the cart using cartId_variantId
  //       - if exists → update quantity (quantity + 1)
  //       - else → add new item to cart
  // 7. commit transaction and return response

  const userId = req.user.id;

  const variantId = req.body.variantId;

  if (!variantId) {
    throw new ApiError(400, "Send a proper variant id");
  }

  const updatedCart = await prisma.$transaction(async (tx) => {
    const variant = await tx.variant.findUnique({
      where: {
        id: variantId,
      },
      select: {
        id: true,
        stock: true,
        isActive: true,
      },
    });

    if (!variant || !variant.isActive) {
      throw new ApiError(400, "Send a valid variant id");
    }

    const cart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const cartItem = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variantId,
        },
      },
    });

    if (!cartItem) {
      if (variant.stock < 1) {
        throw new ApiError(400, "Item is not in stock");
      } else {
        const updatedCartitem = await tx.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: variantId,
            quantity: 1,
          },
        });

        const updatedCart = await tx.cart.findUnique({
          where: {
            id: cart.id,
          },
          include: {
            items: true,
          },
        });

        return updatedCart;
      }
    }

    const updatedCartItemQuantity = cartItem.quantity + 1;
    if (updatedCartItemQuantity > variant.stock) {
      throw new ApiError(400, "Item is out of stock");
    }

    await tx.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity: { increment: 1 },
      },
    });

    const updatedCart = await tx.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: true,
      },
    });

    return updatedCart;
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedCart, "Item added to the cart"));
});

// delete cart item quantity
export const removeCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const variantId = req.body.variantId;

  if (!variantId) {
    throw new ApiError(400, "variant id cannot be empty");
  }

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!cart) {
      throw new ApiError(400, "There is no cart attached to the user");
    }

    await tx.cartItem.delete({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variantId,
        },
      },
    });

    return {
      message: "Deleted the cart item successfully",
    };
  });

  res.status(200).json(new ApiResponse(200, result.message));
});

// remove item from the cart
export const reduceItemQuantity = asyncHandler(async (req, res) => {
  // get user id from the middle ware and variatn id from the body
  // validate the variant id
  // start the transaction
  // find the cart using the user id
  // now check id the cartItem exists using the cart.id and variantId
  // if it is there check the quantity
  // if quantity > 1 -> then reduce the quantity - 1
  // else -> remove the cart item
  // then send the appropriate response

  const userId = req.user.id;
  const variantId = req.body.variantId;

  if (!variantId) {
    throw new ApiError(400, "Send a variant id");
  }

  const result = await prisma.$transaction(async (tx) => {
    const variant = await tx.variant.findUnique({
      where: {
        id: variantId,
      },
    });

    if (!variant) {
      throw new ApiError(400, "Send a valid variant id");
    }

    const cart = await tx.cart.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!cart) {
      throw new ApiError(400, "There is no cart of the user ");
    }

    const cartItem = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variantId,
        },
      },
    });

    if (!cartItem) {
      throw new ApiError(400, "item is not in the cart");
    }

    if (cartItem.quantity > 1) {
      const udatedCartItem = await tx.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity: { decrement: 1 },
        },
      });

      return {
        message: "reduced the quantity successfully",
      };
    } else {
      await tx.cartItem.delete({
        where: {
          id: cartItem.id,
        },
      });
    }

    return {
      message: "Deleted the product successfully",
    };
  });

  res.status(200).json(new ApiResponse(200, result.message));
});

// Delete entire cart
export const deleteEntireCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await prisma.cart.delete({
    where: {
      userId: userId,
    },
  });

  if (!cart) {
    throw new ApiError(400, "Cart for the user does not exists");
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  res.status(200).json(new ApiResponse(200, "Deleted the Entire cart"));
});

// cart validation
export const validateCart = asyncHandler(async (req, res) => {
  // 1. Fetch cart + relations
  // 2. If empty → invalid
  // 3. Validate each item (existence, active, stock)
  // 4. Recalculate subtotal
  // 5. Validate coupon
  // 6. Compute discount
  // 7. Compute total
  // 8. Return structured validation response

  const userId = req.user.id;

  const cart = await prisma.cart.findUnique({
    where: {
      userId: userId,
    },
    include: {
      items: {
        include: {
          variant: {
            select: {
              id: true,
              stock: true,
              price: true,
              isActive: true,
            },
          },
        },
      },
      coupon: true,
    },
  });

  if (!cart) {
    throw new ApiError(400, "There is no user cart");
  }

  if (cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  let subTotal = 0;
  const itemErrors = [];
  const couponErrors = [];

  for (const item of cart.items) {
    const variant = item.variant;

    if (!variant) {
      itemErrors.push(`Variant for item ${item.variantId} does not exist`);
      continue;
    }

    if (!variant.isActive) {
      itemErrors.push(`Product is no longer available`);
    }

    if (item.quantity > variant.stock) {
      itemErrors.push(`Product is no longer available`);
    }

    subTotal += variant.price * item.quantity;
  }

  const midwayResponseData = {
    isValid: itemErrors.length === 0,
    itemErrors,
  };

  if (itemErrors.length > 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          midwayResponseData,
          "cart cannot proceed to checkout due to variant issue"
        )
      );
  }

  let discount = 0;

  if (cart.coupon) {
    const coupon = cart.coupon;

    let couponValid = true;

    if (!coupon.isActive) {
      couponErrors.push("Coupon is inactive");
      couponValid = false;
    }

    if (coupon.expiryDate < new Date()) {
      couponErrors.push("Coupon has expired");
      couponValid = false;
    }

    if (coupon.minimumCartAmount && subTotal < coupon.minimumCartAmount) {
      couponErrors.push("Minimum cart amount not met for coupon");
      couponValid = false;
    }

    if (couponValid) {
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
  }

  const total = Math.max(subTotal - discount, 0);

  const responseData = {
    isValid: itemErrors.length === 0,
    subTotal,
    discount,
    total,
    couponErrors,
    itemErrors,
  };

  res
    .status(200)
    .json(new ApiResponse(200, responseData, "Here is your validated cart"));
});

// apply coupon
export const applyCouponToCart = asyncHandler(async (req, res) => {
  // 1. Validate cart exists
  //  2. Validate coupon exists
  // 3. Validate coupon basic rules
  // 4. Optionally pre-check usage count
  // 5. Attach couponId to cart
  // 6. Return success

  const userId = req.user.id;
  const code = req.body.code?.trim();

  if (!code) {
    throw new ApiError(400, "Send the Coupon code");
  }

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                stock: true,
                price: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(
        400,
        "Either cart of this user does not exist or its empty"
      );
    }

    let subTotal = 0;

    for (const item of cart.items) {
      const variant = item.variant;
      subTotal += variant.price * item.quantity;
    }

    const coupon = await tx.coupon.findUnique({
      where: {
        code: code,
      },
    });

    if (!coupon) {
      throw new ApiError(400, "Send a valid Coupond Code");
    }

    if (!coupon.isActive) {
      throw new ApiError(400, "Coupon is not active");
    }

    if (coupon.expiryDate < new Date()) {
      throw new ApiError(400, "Coupon expired");
    }

    if (coupon.minimumCartAmount && subTotal < coupon.minimumCartAmount) {
      throw new ApiError(400, "Cart is not upto the minimum amount");
    }

    const usageCount = await tx.couponUsage.count({
      where: {
        userId,
        couponId: coupon.id,
      },
    });

    if (coupon.maxUsagePerUser && usageCount >= coupon.maxUsagePerUser) {
      throw new ApiError(400, "Max usage limit has been reached");
    }

    await tx.cart.update({
      where: {
        userId: userId,
      },
      data: { couponId: coupon.id },
    });

    return {
      message: "added the coupon successfully",
    };
  });

  res.status(200).json(new ApiResponse(200, result.message));
});

// Delete coupon
export const DeleteCouponToCart = asyncHandler(async (req, res) => {
  // get user id from the middle ware
  // find the cart using the user id
  // validate if cart exists
  // if yes then set the couponid to null in the cart

  const userId = req.user.id;

  await prisma.cart.update({
    where: { userId },
    data: { couponId: null },
  }); 

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Coupon removed successfully"));
});

// update cart item qunatity (do not need it currently will need it when increasing the quantity by a spcific number )
// export const updateItemQuantity = asyncHandler(async (req, res) => {});
// Experimental will work on it later (Cart merge) merging cart when user is not logged in
