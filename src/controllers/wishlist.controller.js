import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { includes } from "zod";

// add product to wishlist : POST
export const addProductToUserWishlist = asyncHandler(async (req, res) => {
  // get user id from the middleware
  // get product id in the body
  // validate the product
  // check for the already existing wishlist -> if no create one add product
  // if yes : check the product existance
  // if not add the product and send the reponse

  const userId = req.user.id;
  const { productId } = req.body;

  const validatedProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!validatedProduct) {
    throw new ApiError(400, "Product does not exist send a valid product ID");
  }

  const checkwishlist = await prisma.wishlist.findUnique({
    where: {
      userId: userId,
    },
  });


  if (!checkwishlist) {
     const wishlist = await prisma.wishlist.create({
      data: {
        userId: userId,
        items: {
          create: {
            productId: productId,
          },
        },
      },
      include: {
        items: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, wishlist, "Created the wislist successfully"));
  }

  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: checkwishlist.id,
        productId: productId,
      },
    },
  });

  if (existingItem) {
   return  res
      .status(400)
      .json(new ApiResponse(400, existingItem, "product already exists "));
  }

  const updatedWishlist = await prisma.wishlist.update({
    where: {
      userId: userId,
    },
    data: {
      items: {
        create: {
          productId: productId,
        },
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedWishlist,
        "added the product to the wishlist successfully"
      )
    );
});

// Get User Wishlist : GET
export const getUserWishlist = asyncHandler(async (req, res) => {
  // request the user id from the params
  // the look for the wishlisht with the user id
  // as soon as we will get it we will go and serch the wishlist item and include it in the same command where we are looking for the wishlist
  // after that we will reponnd back with the given response

  const id = req.user.id;

  const wishlist = await prisma.wishlist.findUnique({
    where: {
      userId: id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!wishlist) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          "The wishlist that you are looking for the user might not exist add a product to make the wishlish appear"
        )
      );
  }

  const responseData = {
    count: wishlist.items.length,
    data: wishlist.items,
  };
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        responseData,
        "Fetched the user wishlist item successfully"
      )
    );
});

// remove product : Delete
export const removeProductFromUserWishlist = asyncHandler(async (req, res) => {
  // here we will request the user id from the middle ware
  // and we will request the product id of the prduct whch is to be removed
  // validate the product id and generate a proper response
  // now look for the wishlist with user id and in that wishlish search the wishlistItem table to find the entry with that product and then delete it
  // send an appropriate response

  const userId = req.user.id;
  const { productId } = req.body;

  const checkProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
  const wishlist = await prisma.wishlist.findUnique({
    where: {
      userId: userId,
    },
  });

  if (!checkProduct) {
    throw new ApiError(400, "Send a valid Product id");
  }

  await prisma.wishlistItem.delete({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId: productId,
      },
    },
  });

  const updatedWishlist = await prisma.wishlist.findUnique({
    where: {
      userId: userId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return res
  .status(200)
  .json(new ApiResponse(200,updatedWishlist, "Remove the product from the wishlist successfully" ))
});

// clear all wishlist : Delete
export const clearAllWishlistOfTheUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await prisma.wishlistItem.deleteMany({
    where: {
      wishlist: {
        userId: userId,
      },
    },
  });

  return res
  .status(200)
  .json(200, "Deleted the entire user wishlist")
});

// check product existance : Get
export const checkProduct = asyncHandler(async (req, res) => {});
