import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


// create product
export const createProduct = asyncHandler(async (req,res) => {
    // request the necessary details regarding the product
    // check the necessary details 
    // create the product with those things 
    // check for the variants if yes create them if no proceed
    // send the response

    const {name, } = req.body
})


// update product
export const updateProduct = asyncHandler(async(req, res) => {
    // request the details that we will be needing in order 
    // use the update product schema to check what need to be updated 
    // respond with the updated user
})


// get product by id 
export const getProductById = asyncHandler(async(req, res) => {
    // request the product in the prarams
    // check and validate the id 
    // check the db and fetch the product
    // respond with the product
})

// delete product by id 
export const deleteProductById = asyncHandler(async(req, res) => {
    // request the product id in the params
    // check and validate the id 
    // find the product in the db
    // delete the product
    // and respond back to the user wwith the success or failure message
}) 

