import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { updateProductSchema } from "../schema/product.schema.js";

// create product
export const createProduct = asyncHandler(async (req, res) => {
  // request the necessary details regarding the product
  // check the necessary details
  // create the product with those things
  // check for the variants if yes create them if no proceed
  // send the response

  // requesting the detaails about the product and verifying them
  const { name, description, subCategoryId, rating } = req.body;

  if (!(name || description || subCategory || rating)) {
    throw new ApiError(400, "You must send everything to create a product");
  }

  const subCategory = await prisma.subCategory.findUnique({
    where: {
      id: subCategoryId,
    },
  });

  if (!subCategory) {
    throw new ApiError(400, "Please send a valid Subcategory");
  }

  const floatRating = Number(req.body.rating);

  const variants = JSON.parse(req.body.variants);

  const product = await prisma.product.create({
    data: {
      name: name,
      description: description,
      subCategoeryId: subCategoryId,
      rating: floatRating,
      variants: {
        create: variants.map((variant) => ({
          imageUrl : variant.imageUrl,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
        })),
      },
    },
    include: {
      variants: true,
    },
  });

  if (!product) {
    throw new ApiError(
      400,
      "There is some trouble in creating the product in the database"
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, product, "Created the product successfully"));
});

// update product
export const updateProduct = asyncHandler(async (req, res) => {
  // request the details that we will be needing in order
  // use the update product schema to check what need to be updated
  // respond with the updated user

  const {id} = req.params

    const productCheck = await prisma.product.findUnique({
        where : {
            id : id
        }
    })
    if(!productCheck) {
        throw new ApiError(400, "Send the valid id to update the product")
    }

    const validateData = updateProductSchema.parse(req.body);

    if(!validateData){
        throw new ApiError(400, "data is not present to update the product")
    }

    const product = await prisma.product.update({
      where :{
            id : id
        },
        data : validateData
    })

    if(!product){
        throw new ApiError(400, "There is some in updating the product")
    }

    res
    .status(200)
    .json(new ApiResponse(200, product , "Updated the product successfully"))
});

// get product by id
export const getProductById = asyncHandler(async (req, res) => {
  // request the product in the prarams
  // check and validate the id
  // check the db and fetch the product
  // respond with the product

  const {id} = req.params

  if (!id) {
    throw new ApiError(400 , "Send an product id in the params")
  }

  const product = await prisma.product.findUnique({
    where : {
        id : id 
    },
    include: {
        variants : true
    }
  })

  if(!product) {
    throw new ApiError(400, "There is not product with this product id or prisma is unable to fetch the product")
  }

  res
  .status(200)
  .json(new ApiResponse(200 , product , "Fetched the product successfully"))
});

// delete product by id
export const deleteProductById = asyncHandler(async (req, res) => {
  // request the product id in the params
  // check and validate the id
  // find the product in the db
  // delete the product
  // and respond back to the user wwith the success or failure message

  const {id} = req.body;

  const productCheck = await prisma.product.update({
    where : {
      id : id
    },
  })

  if(!productCheck){
    throw new ApiError(400, "There is no product with there details that might be different ")
  }

  await prisma.product.delete({
    where : {
      id : id
    }
  })

  res
  .status(200)
  .json(new ApiResponse(200,"Deleted the product successfully"))

});

export const getAllProduct = asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany();

    res
    .status(200)
    .json(new ApiResponse(200, products , "fetched all the products successfully"))
});
