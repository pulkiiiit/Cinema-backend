import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { prisma } from "../../lib/prisma.js";
import { updateReviewSchema } from "../schema/review.schema.js";


// create a review 

export const createReview = asyncHandler(async(req, res) => {
    // get all the details of the review in the req.body
    // get the user from the middleware and product id form the params verify the product id 
    // create a review and send a response
    
    const {rating , comment} = req.body;
    const userId = req.user.id;
    const productId = req.params;

    const checkProduct = await prisma.product.findUnique({
        where : {
            id : productId
        }
    })

    if(!checkProduct){
        throw new ApiError (400, "send a valid product id")
    }

    const review = await prisma.review.create({
        data : {
            rating : rating,
            comment : comment,
            userId : userId,
            productId : checkProduct.id
        }
    })
    
    res
    .status(200)
    .json(new ApiResponse(200 , review , "created the review successfully"))
})


// update a review
export const updateReview = asyncHandler(async(req, res) => {
    const id = req.params
    const {} = req.body

    const checkReview = await prisma.review.findUnique({
        where : {
            id : id 
        }
    })

    if(!checkReview) {
        throw ApiError(400, "send a valid review id")
    }

    const validateData = updateReviewSchema.parse(req.body);

    const updatedReview = await prisma.review.update({
        where : {
            id : id
        },
        data : validateData,
    })

    if(!updateReview){
        throw new ApiError(400, "There was some error while updting the review")
    }

    res
    .status(200)
    .json(new ApiResponse(200, updatedReview , "Update the review successfully"))
})


// get all review for the product by id 
export const getReviewOfProductById = asyncHandler(async(req, res) => {

    const id = req.params

    const checkProduct = await prisma.product.findUnique({
        where: {
            id : id,
        }
    })

    if(!checkProduct){
        throw new ApiError(400 , "send a valid product id")
    }

    const allProductReviews = await prisma.review.findMany({
        where : {
            productId : id
        },
        include:{
            user: {
                select: {
                    id: true,
                    name: true,
                }
            }
        }
    })

    if(!allProductReviews){
        throw new ApiError(400, "There was some error while fetching the details form the db")
    }

    res
    .status(200)
    .json(new ApiResponse(200 , allProductReviews , "fetched all the products review"))
})


// get all review made by a user by id 
export const getReviewsMadeByUser = asyncHandler(async(req, res) => {

    const userId = req.user.id;

    const userReviews = await prisma.review.findMany({
        where : {
            userId : userId
        },
        include: {
            product : {
                select : {
                    id : true,
                    name : true,
                }
            }
        }
    })

    res
    .status(200)
    .json(new ApiResponse(200, userReviews , "Fetched all the user reviews successfully"))
})


// delete a review 
export const deleteReview = asyncHandler(async(req, res) => {
    const id = req.params

    const checkreview = await prisma.review.findUnique({
        where : {
            id : id
        }
    })

    if(!checkreview){
        throw new ApiError(400 , "Send a valid review id")
    }

    await prisma.review.delete({
        where : {
            id : id 
        }
    })

    res
    .status(200)
    .json(new ApiResponse(200, "Deleted the review successfully"))
})

