import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { createVariantSchema, updateVariantSchema } from "../schema/variant.schema.js";


// create the new variant [POST]
export const createNewVariant = asyncHandler(async(req, res) => {
    // get the details for creating the variant along with the product id 
    // validate the product 
    // create the variant and send check if its exists 
    // send the appropriate response

    const productId = req.params.productid;

    if (!productId) {
        throw new ApiError(400, "send a product id")
    }
    
    const product = await prisma.product.findUnique({
        where: {
            id : productId
        }
    })

    if(!product){
        throw new ApiError(400, "Send a valid product id")
    }

    const variantDetails = createVariantSchema.parse(req.body)

    variantDetails.productId = productId

    const variant = await prisma.variant.create({
        data : variantDetails
    })

    return res
    .status(200)
    .json(new ApiResponse(200, variant, "created the vriant successfully "))
})


// update the price stock sku [PUT]
export const updateVariant = asyncHandler(async(req, res) => {
    // get the variant id 
    // validate the variant id 
    // parse the updated fields 
    // update and send the response 

    const variantid = req.params.variantid;
    
    if(!variantid){
        throw new ApiError(400, "send a variant id")
    }

    const variant = await prisma.variant.findUnique({
        where : {
            id : variantid
        }
    })

    if(!variant){
        throw new ApiError(400 , "Send a valid variant id")
    }
    const updatedData  = updateVariantSchema.parse(req.body)

    const updatedVariant = await prisma.variant.update({
        where : {
            id : variant.id
        },
        data : updatedData                                                      
    })

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVariant , "updated the variant successfully"))
})


// Activate and deactivate variant [PATCH]
export const toggleVariantStatus = asyncHandler(async(req, res) => {
    const variantid = req.params.variantid

    if(!variantid){
        throw new ApiError(400, "Send a variant id")
    }

    const variant = await prisma.variant.findUnique({
        where : {
            id : variantid
        }
    })

    if(!variant){
        throw new ApiError(400, "Send a valid variant id variant not found")
    }

    const updatedVariant = await prisma.variant.update({
        where : {
            id : variant.id
        },
        data : {
            isActive: !variant.isActive
        }
    })

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVariant, "changed the status of the variant"))
})


// View All Variants[GET]
export const getAllVariant = asyncHandler(async(req, res) => {

    const variants = await prisma.variant.findMany()
    
    return res
    .status(200)
    .json(new ApiResponse(200,variants,"Fetched all the variants successfully"))
})


// Get All active variants [GET]pagination
export const getAllActiveVariant = asyncHandler(async(req, res) => {

    const variant = await prisma.variant.findMany({
        where : {
            isActive : true
        }
    })

    return res
    .status(200)
    .json(new ApiResponse(200, variant ,"fetched all the active variant"))
})


// Get Variant by ID [GET]
export const getVariantById = asyncHandler(async(req, res) => {
    const variantid = req.params.variantid

    if (!variantid){
        throw new ApiError(400 , "Send a variant id ")
    }

    const variant = await prisma.variant.findUnique({
        where : {
            id : variantid
        }
    })

    if(!variant){
        throw new ApiError(400 , "Send a valid api id")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , variant, "Fetched the variant success fully" ))
})